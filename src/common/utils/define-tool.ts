import { BlockDefinition } from '@inf-monkeys/vines';

export interface ExtendedToolDefinition extends BlockDefinition {
  hidden?: boolean;
  handler?: (input: { [x: string]: any }) => Promise<any>;
}

export default function defineTool(definition: ExtendedToolDefinition): BlockDefinition {
  return definition;
}
