import { Injectable, Logger } from '@nestjs/common';
import { AgentV3RunLoopService } from '@/modules/agent-v3/agent-v3.run-loop.service';
import { AgentV3SessionRepository } from '@/database/repositories/agent-v3-session.repository';
import { TldrawAgentV3BindingRepository } from '@/database/repositories/tldraw-agent-v3-binding.repository';
import { tool } from 'ai';
import { z } from 'zod';
import { WorkflowRepository } from '@/database/repositories/workflow.repository';

export type CanvasSnapshot = {
  nodes?: Array<Record<string, any>>;
  viewport?: Record<string, any>;
  selectionIds?: string[];
};

export interface TldrawAgentV3StreamOptions {
  boardId: string;
  teamId: string;
  userId: string;
  modelId?: string;
  message: string;
  sessionId?: string;
}

@Injectable()
export class TldrawAgentV3Service {
  private readonly logger = new Logger(TldrawAgentV3Service.name);
  private readonly snapshotCache = new Map<string, CanvasSnapshot>();

  constructor(
    private readonly bindingRepo: TldrawAgentV3BindingRepository,
    private readonly sessionRepo: AgentV3SessionRepository,
    private readonly runLoop: AgentV3RunLoopService,
    private readonly workflowRepo: WorkflowRepository,
  ) {}

  private tldrawSystemPrompt = [
    '你是一个画布工作流助手，负责在 tldraw 画板上创建、更新、删除工作流节点。',
    '所有画布操作必须使用提供的工具完成，不要用文字描述手动步骤。',
    '',
    '重要：创建工作流节点时，props 应该是包含以下字段的 JSON 字符串：',
    '- workflowId: 工作流ID（必需）',
    '- name 或 workflowName: 工作流名称',
    '- description 或 workflowDescription: 工作流描述（可选）',
    '- w: 节点宽度，默认280（可选）',
    '- h: 节点高度，默认120（可选）',
    '示例：{"workflowId":"workflow-123","name":"文本生成","description":"使用LLM生成文本","w":300,"h":150}',
    '',
    '在执行 create/update/delete 前，请通过 get_canvas_state 获取最新画布状态以确保位置和节点存在性。',
    '需要选择具体工作流时，先用 list_available_workflows 获取可用的工作流列表，然后再创建或更新节点。',
    '使用简体中文回复，每次工具执行后简要说明结果。',
    '完成思考/工具调用后，必须输出一个可读的回答（即便是确认或追问），不要返回空响应。',
  ].join('\n');

  private getTools(sessionId: string, teamId: string) {
    const getCanvasState = tool({
      description: '获取当前画布状态（节点列表、视口、选区）',
      inputSchema: z.object({}),
      execute: async () => {
        const snapshot = this.snapshotCache.get(sessionId);
        return {
          success: true,
          data: snapshot || { nodes: [], viewport: null, selectionIds: [] },
        };
      },
    });

    const createWorkflowNode = tool({
      description: '在画布上创建一个新的工作流节点。props必须包含workflowId和name/workflowName字段，可选包含description、w（宽度）、h（高度）等',
      inputSchema: z.object({
        id: z.string().describe('节点唯一ID，建议使用简短的字符串如"wf1"、"wf2"'),
        x: z.number().describe('X坐标'),
        y: z.number().describe('Y坐标'),
        type: z.string().describe('节点类型，固定为"workflow"'),
        props: z
          .string()
          .describe(
            '节点属性JSON字符串，必须包含：workflowId（工作流ID）、name或workflowName（名称）；可选：description、w（宽度，默认280）、h（高度，默认120）。示例：{"workflowId":"wf-123","name":"文本生成","w":300}',
          ),
      }),
      execute: async (input) => {
        this.logger.debug(`create_workflow_node: ${input.id}`);
        // 解析 JSON 字符串为对象
        let props: any;
        try {
          props = JSON.parse(input.props);
        } catch (error) {
          this.logger.error(`Failed to parse props JSON: ${error.message}`);
          return { success: false, error: 'Invalid props JSON format' };
        }
        return { success: true, data: { ...input, props } };
      },
    });

    const updateWorkflowNode = tool({
      description: '更新现有工作流节点的属性。可以更新name/workflowName、description、w（宽度）、h（高度）等字段',
      inputSchema: z.object({
        id: z.string().describe('要更新的节点ID'),
        props: z.string().describe('要更新的属性JSON字符串，例如：{"name":"新名称","w":350}'),
      }),
      execute: async (input) => {
        this.logger.debug(`update_workflow_node: ${input.id}`);
        // 解析 JSON 字符串为对象
        let props: any;
        try {
          props = JSON.parse(input.props);
        } catch (error) {
          this.logger.error(`Failed to parse props JSON: ${error.message}`);
          return { success: false, error: 'Invalid props JSON format' };
        }
        return { success: true, data: { ...input, props } };
      },
    });

    const deleteWorkflowNode = tool({
      description: '删除画布上的工作流节点',
      inputSchema: z.object({
        id: z.string(),
      }),
      execute: async (input) => {
        this.logger.debug(`delete_workflow_node: ${input.id}`);
        return { success: true, data: input };
      },
    });

    const listAvailableWorkflows = tool({
      description: '获取当前团队可用的工作流列表，用于创建/替换节点',
      inputSchema: z.object({
        keyword: z.string().optional(),
        page: z.number().int().positive().optional(),
        limit: z.number().int().positive().max(100).optional(),
      }),
      execute: async (input) => {
        const page = input.page ?? 1;
        const limit = input.limit ?? 20;
        const keyword = input.keyword?.trim();
        const workflows = await this.workflowRepo.getAllWorkflows(teamId);
        const normalized = keyword?.toLowerCase();
        const filtered = normalized
          ? workflows.filter((w: any) => {
              const name = (w.displayName || w.name || '').toLowerCase();
              const desc = (w.description || '').toLowerCase();
              const id = (w.id || '').toLowerCase();
              return name.includes(normalized) || desc.includes(normalized) || id.includes(normalized);
            })
          : workflows;
        const sliced = filtered.slice((page - 1) * limit, page * limit);
        return {
          success: true,
          data: sliced.map((w) => ({
            id: w.id,
            name: (w as any).displayName || (w as any).name || w.id,
            description: (w as any).description || '',
            version: (w as any).version,
            updatedAt: (w as any).updatedTimestamp,
          })),
          total: filtered.length,
          page,
          limit,
        };
      },
    });

    return {
      get_canvas_state: getCanvasState,
      create_workflow_node: createWorkflowNode,
      update_workflow_node: updateWorkflowNode,
      delete_workflow_node: deleteWorkflowNode,
      list_available_workflows: listAvailableWorkflows,
    };
  }

  updateSnapshot(sessionId: string, snapshot?: CanvasSnapshot) {
    if (!snapshot) {
      return;
    }
    this.snapshotCache.set(sessionId, snapshot);
  }

  findBinding(boardId: string, teamId: string) {
    return this.bindingRepo.findByBoard(boardId, teamId);
  }

  async resolveSession(params: { boardId: string; teamId: string; userId: string; sessionId?: string; modelId?: string }) {
    const { boardId, teamId, userId, sessionId, modelId } = params;

    const existingBinding = await this.bindingRepo.findByBoard(boardId, teamId);
    // 优先使用已存在的绑定
    if (existingBinding) {
      return existingBinding.sessionId;
    }

    if (sessionId) {
      const session = await this.sessionRepo.getById(teamId, userId, sessionId);
      if (session) {
        await this.bindingRepo.createBinding({ boardId, teamId, userId, sessionId });
        return sessionId;
      }
      // 如果传入的 sessionId 无效，则创建新会话
    }

    const created = await this.sessionRepo.createSession(teamId, userId, {
      title: `Tldraw ${boardId}`,
      modelId,
    });
    await this.bindingRepo.createBinding({
      boardId,
      teamId,
      userId,
      sessionId: created?.id || '',
    });
    return created.id;
  }

  stream(options: TldrawAgentV3StreamOptions, snapshot?: CanvasSnapshot) {
    if (snapshot) {
      this.updateSnapshot(options.sessionId!, snapshot);
    }

    const tools = this.getTools(options.sessionId!, options.teamId);

    return this.runLoop.runAgentLoop({
      sessionId: options.sessionId!,
      teamId: options.teamId,
      userId: options.userId,
      modelId: options.modelId,
      userMessage: options.message,
      systemPrompt: this.tldrawSystemPrompt,
      tools,
    });
  }
}
