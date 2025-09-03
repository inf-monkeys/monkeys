// Adapted from agent-code/src/core/assistant-message/AssistantMessageParser.ts

// Simplified tool-related types for backend usage.
// In a real scenario, these might be more robustly defined in a shared types library.
export type ToolName = 'use_mcp_tool' | 'access_mcp_resource' | 'ask_followup_question' | 'attempt_completion' | 'new_task' | 'update_todo_list';
export const toolNames: ToolName[] = ['use_mcp_tool', 'access_mcp_resource', 'ask_followup_question', 'attempt_completion', 'new_task', 'update_todo_list'];

export type ToolParamName = 'server_name' | 'tool_name' | 'arguments' | 'uri' | 'question' | 'result' | 'message' | 'todos' | 'content';
export const toolParamNames: ToolParamName[] = ['server_name', 'tool_name', 'arguments', 'uri', 'question', 'result', 'message', 'todos', 'content'];

export interface TextContent {
  type: 'text';
  content: string;
  partial: boolean;
}

export interface ToolUse {
  type: 'tool_use';
  id: string; // Add ID for tracking
  name: ToolName;
  params: Record<string, any>; // Use params to match agent-code
  partial: boolean;
}

export type AssistantMessageContent = TextContent | ToolUse;
export type ToolCall = ToolUse;

/**
 * Parser for assistant messages. Maintains state between chunks
 * to avoid reprocessing the entire message on each update.
 */
export class AssistantMessageParser {
  private contentBlocks: AssistantMessageContent[] = [];
  private readonly MAX_ACCUMULATOR_SIZE = 1024 * 1024; // 1MB limit
  private accumulator = '';
  private toolIdCounter = 0;

  constructor() {
    this.reset();
  }

  public reset(): void {
    this.contentBlocks = [];
    this.accumulator = '';
    this.toolIdCounter = 0;
  }

  public getContentBlocks(): AssistantMessageContent[] {
    return this.contentBlocks.slice();
  }

  /**
   * Process OpenAI function calls directly
   */
  public processFunctionCalls(functionCalls: any[]): AssistantMessageContent[] {
    functionCalls.forEach((call) => {
      const toolCall: ToolUse = {
        type: 'tool_use',
        id: call.id || `tool_${this.toolIdCounter++}`,
        name: call.function?.name as ToolName,
        params: call.function?.arguments ? JSON.parse(call.function.arguments) : {},
        partial: false,
      };

      // Only add if it's a valid tool name
      if (toolNames.includes(toolCall.name)) {
        this.contentBlocks.push(toolCall);
      }
    });

    return this.getContentBlocks();
  }

  public processChunk(chunk: string): AssistantMessageContent[] {
    if (this.accumulator.length + chunk.length > this.MAX_ACCUMULATOR_SIZE) {
      throw new Error('Assistant message exceeds maximum allowed size');
    }

    this.accumulator += chunk;

    // Parse XML-style tool calls (matching system prompt format)
    // Look for patterns like: <use_mcp_tool><server_name>value</server_name><tool_name>value</tool_name></use_mcp_tool>

    for (const toolName of toolNames) {
      const toolRegex = new RegExp(`<${toolName}>(.*?)<\/${toolName}>`, 'gs');
      let match: RegExpExecArray | null;

      while ((match = toolRegex.exec(this.accumulator)) !== null) {
        const toolContent = match[1];
        const params: Record<string, any> = {};

        // Extract parameters from XML tags within the tool call
        for (const paramName of toolParamNames) {
          const paramRegex = new RegExp(`<${paramName}>(.*?)<\/${paramName}>`, 's');
          const paramMatch = toolContent.match(paramRegex);
          if (paramMatch) {
            params[paramName] = paramMatch[1].trim();
          }
        }

        // Only add if we found some parameters and haven't already added this tool call
        if (Object.keys(params).length > 0) {
          const toolId = `tool_${this.toolIdCounter}`;
          if (!this.contentBlocks.some((b) => b.type === 'tool_use' && b.id === toolId)) {
            this.contentBlocks.push({
              type: 'tool_use',
              id: toolId,
              name: toolName,
              params,
              partial: false,
            });
            this.toolIdCounter++;
          }
        }
      }
    }

    // Extract plain text (everything outside tool calls)
    let plainText = this.accumulator;
    for (const toolName of toolNames) {
      const toolRegex = new RegExp(`<${toolName}>.*?<\/${toolName}>`, 'gs');
      plainText = plainText.replace(toolRegex, '').trim();
    }

    // Update or create text content block
    const textBlock = this.contentBlocks.find((b) => b.type === 'text') as TextContent;
    if (textBlock) {
      textBlock.content = plainText;
    } else if (plainText) {
      this.contentBlocks.push({ type: 'text', content: plainText, partial: false });
    }

    return this.getContentBlocks();
  }

  public finalizeContentBlocks(): void {
    for (const block of this.contentBlocks) {
      block.partial = false;
      if (block.type === 'text' && typeof block.content === 'string') {
        block.content = block.content.trim();
      }
    }
  }
}
