import { BlockDefinition } from '@inf-monkeys/vines';

export interface WorkflowContext {
  taskId: string;
  workflowInstanceId: string;
}

export interface ExtendedToolDefinition extends BlockDefinition {
  hidden?: boolean;
  handler?: (input: { [x: string]: any }, context: WorkflowContext) => Promise<any>;
}

export default function defineTool(definition: ExtendedToolDefinition): BlockDefinition {
  return definition;
}
