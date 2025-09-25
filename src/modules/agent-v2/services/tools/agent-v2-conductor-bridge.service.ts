import { WorkflowTriggerType } from '@/database/entities/workflow/workflow-trigger';
import { ToolsRegistryService } from '@/modules/tools/tools.registry.service';
import { ConductorService } from '@/modules/workflow/conductor/conductor.service';
import { WorkflowExecutionService } from '@/modules/workflow/workflow.execution.service';
import { Injectable, Logger } from '@nestjs/common';
import { ToolResult } from '../types/tool-types';

@Injectable()
export class AgentV2ConductorBridgeService {
  private readonly logger = new Logger(AgentV2ConductorBridgeService.name);

  constructor(
    private readonly conductorService: ConductorService,
    private readonly workflowExecutionService: WorkflowExecutionService,
    private readonly toolsRegistryService: ToolsRegistryService,
  ) {}

  /**
   * Execute a single external tool through a minimal Conductor workflow, so that
   * the tool runs with full workflow context (headers, task/instance ids, etc.).
   */
  public async executeViaWorkflow(toolName: string, params: Record<string, any>, teamId: string, userId: string): Promise<ToolResult> {
    // Build a stable workflow id for this tool
    const workflowId = this.buildWorkflowId(toolName);

    // Load tool def to get type information if available
    const toolDef = await this.toolsRegistryService.getToolByName(toolName);
    const toolType = (toolDef as any)?.type || 'SIMPLE';

    // Reference name for the single task
    const taskRef = 'invoke_tool';

    // Map inputs: each param is passed from workflow.input
    const inputParameters: Record<string, any> = {};
    for (const key of Object.keys(params || {})) {
      inputParameters[key] = '${workflow.input.' + key + '}';
    }

    // Minimal one-task workflow definition
    const tasks: any[] = [
      {
        name: toolName,
        taskReferenceName: taskRef,
        type: toolType,
        inputParameters,
      },
    ];

    // Make workflow output equals to tool outputData
    const output = [
      {
        key: 'result',
        value: '${' + taskRef + '.output.outputData}',
      },
    ];

    // Register/Update workflow definition in Conductor
    await this.conductorService.saveWorkflowInConductor({
      workflowId,
      version: 1,
      tasks,
      output,
      teamId,
      description: `AgentV2 single-tool runner for ${toolName}`,
    } as any);

    // Start execution (temp=true to skip DB workflow lookup) and wait result
    const workflowInstanceId = await this.workflowExecutionService.startWorkflow(
      {
        teamId,
        userId,
        workflowId,
        version: 1,
        inputData: params || {},
        triggerType: WorkflowTriggerType.MANUALLY,
        group: 'agentv2-tool',
        extraMetadata: {
          source: 'agentv2',
          toolName,
        },
        isTemporary: true,
      },
      true,
    );

    const result = await this.workflowExecutionService.waitForWorkflowResult(teamId, workflowInstanceId);

    // result expected shape: { result: <toolOutput> }
    const final = (result && (result as any).result) ?? result;
    const outputStr = typeof final === 'string' ? final : JSON.stringify(final ?? {});

    return {
      tool_call_id: `tool_${Date.now()}`,
      output: outputStr,
      is_error: false,
    };
  }

  private buildWorkflowId(toolName: string) {
    // Make a deterministic, Conductor-safe workflowId
    return `agentv2_tool_runner__${toolName.replace(/[^a-zA-Z0-9_:-]/g, '_').replace(/:/g, '__')}`.slice(0, 190);
  }
}
