export interface ToolUse {
  id: string;
  name: string;
  input: Record<string, any>; // Keep as 'input' for the service layer interface
}

export interface ToolResult {
  tool_call_id: string;
  output: string;
  is_error?: boolean;
  images?: any[]; // Support for image attachments in tool results
}

export type AskApproval = (type: string, partialMessage?: string, forceApproval?: boolean) => Promise<boolean>;

export type HandleError = (action: string, error: Error) => Promise<void>;

export type PushToolResult = (result: ToolResult) => void;

export type RemoveClosingTag = (tag: string, content?: string) => string;
