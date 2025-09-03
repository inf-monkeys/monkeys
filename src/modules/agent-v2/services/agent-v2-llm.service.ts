import { config } from '@/common/config';
import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources';

export interface AgentV2ChatParams {
  model?: string;
  messages: ChatCompletionMessageParam[];
  stream?: boolean;
  tools?: string[];
  temperature?: number;
  max_tokens?: number;
}

export interface StreamChunk {
  type: 'text' | 'usage' | 'error';
  text?: string;
  inputTokens?: number;
  outputTokens?: number;
  error?: string;
}

@Injectable()
export class AgentV2LlmService {
  // Add conditional logging for debugging
  private shouldLog = process.env.NODE_ENV !== 'production' || process.env.AGENT_V2_DEBUG === 'true';

  private debugLog(message: string): void {
    if (this.shouldLog) {
      this.logger.debug(message);
    }
  }
  private openaiClient: OpenAI;

  constructor() {
    // Initialize OpenAI client with configuration
    const agentConfig = config.agentv2?.openaiCompatible;
    if (!agentConfig?.apiKey || !agentConfig?.url) {
      throw new Error('Agent V2 OpenAI configuration missing. Please check config.agentv2.openaiCompatible settings.');
    }

    this.openaiClient = new OpenAI({
      apiKey: agentConfig.apiKey,
      baseURL: agentConfig.url,
    });
  }

  /**
   * Create chat completion with real OpenAI compatible API
   */
  async createChatCompletion(teamId: string, params: AgentV2ChatParams): Promise<any> {

    try {
      const openaiParams: OpenAI.Chat.ChatCompletionCreateParams = {
        model: params.model || 'gpt-3.5-turbo',
        messages: params.messages,
        stream: params.stream ?? true,
        temperature: params.temperature ?? 0.7,
        max_tokens: params.max_tokens ?? 4096,
      };

      // Add tools if specified - convert our tool names to OpenAI function calling format
      if (params.tools && params.tools.length > 0) {
        openaiParams.tools = this.convertToolsToOpenAIFormat(params.tools);
      }

      const response = await this.openaiClient.chat.completions.create(openaiParams);

      return response;
    } catch (error) {
      this.logger.error(`Error creating chat completion: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Convert our tool names to OpenAI function calling format
   */
  private convertToolsToOpenAIFormat(toolNames: string[]): OpenAI.Chat.ChatCompletionTool[] {
    const tools: OpenAI.Chat.ChatCompletionTool[] = [];

    toolNames.forEach((toolName) => {
      switch (toolName) {
        case 'use_mcp_tool':
          tools.push({
            type: 'function',
            function: {
              name: 'use_mcp_tool',
              description: 'Execute an MCP (Model Context Protocol) tool from a connected server.',
              parameters: {
                type: 'object',
                properties: {
                  server_name: { type: 'string', description: 'The name of the MCP server' },
                  tool_name: { type: 'string', description: 'The name of the tool to execute' },
                  arguments: { type: 'string', description: 'JSON string containing the tool arguments' },
                },
                required: ['server_name', 'tool_name'],
              },
            },
          });
          break;
        case 'access_mcp_resource':
          tools.push({
            type: 'function',
            function: {
              name: 'access_mcp_resource',
              description: 'Access a resource from an MCP server.',
              parameters: {
                type: 'object',
                properties: {
                  server_name: { type: 'string', description: 'The name of the MCP server' },
                  uri: { type: 'string', description: 'The URI of the resource to access' },
                },
                required: ['server_name', 'uri'],
              },
            },
          });
          break;
        case 'ask_followup_question':
          tools.push({
            type: 'function',
            function: {
              name: 'ask_followup_question',
              description: 'Ask the user a question to gather additional information.',
              parameters: {
                type: 'object',
                properties: {
                  question: { type: 'string', description: 'A clear, specific question' },
                  follow_up: { type: 'string', description: 'List of suggested answers' },
                },
                required: ['question'],
              },
            },
          });
          break;
        case 'attempt_completion':
          tools.push({
            type: 'function',
            function: {
              name: 'attempt_completion',
              description: 'Present final answer or findings to complete the task.',
              parameters: {
                type: 'object',
                properties: {
                  result: { type: 'string', description: 'Your comprehensive answer or findings' },
                },
                required: ['result'],
              },
            },
          });
          break;
        case 'new_task':
          tools.push({
            type: 'function',
            function: {
              name: 'new_task',
              description: 'Create a new task instance.',
              parameters: {
                type: 'object',
                properties: {
                  message: { type: 'string', description: 'The initial instructions for the new task' },
                },
                required: ['message'],
              },
            },
          });
          break;
        case 'update_todo_list':
          tools.push({
            type: 'function',
            function: {
              name: 'update_todo_list',
              description: 'Update the todo list with current task status.',
              parameters: {
                type: 'object',
                properties: {
                  todos: { type: 'string', description: 'Markdown checklist of todos' },
                },
                required: ['todos'],
              },
            },
          });
          break;
      }
    });

    return tools;
  }
}
