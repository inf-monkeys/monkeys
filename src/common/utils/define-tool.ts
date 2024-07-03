import { ToolDef } from '@inf-monkeys/monkeys';

export interface WorkflowContext {
  taskId: string;
  workflowInstanceId: string;
}

export interface ExtendedToolDef extends ToolDef {
  hidden?: boolean;
  handler?: (input: { [x: string]: any }, context: WorkflowContext) => Promise<any>;
}

export default function defineTool(definition: ExtendedToolDef): ToolDef {
  return definition;
}
