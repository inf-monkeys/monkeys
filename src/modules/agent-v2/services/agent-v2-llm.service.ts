import { config } from '@/common/config';
import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources';
import { ToolsRegistryService } from '../../tools/tools.registry.service';
import { isAgentV2BuiltinTool } from '../constants/tools.constants';
import { AgentV2Repository } from './agent-v2.repository';

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
  private readonly logger = new Logger(AgentV2LlmService.name);
  private openaiClient: OpenAI;

  constructor(
    private readonly toolsRegistryService: ToolsRegistryService,
    private readonly agentRepository: AgentV2Repository,
  ) {
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
   * Helper method to extract localized text
   */
  private extractLocalizedText(text: string | object | undefined, fallback: string): string {
    if (typeof text === 'string') {
      return text;
    }

    if (typeof text === 'object' && text !== null) {
      const obj = text as any;
      // 优先级：zh-CN > en-US > zh > en > 第一个可用值
      return obj['zh-CN'] || obj['en-US'] || obj['zh'] || obj['en'] || (Object.values(obj)[0] as string) || fallback;
    }

    return fallback;
  }

  /**
   * Create chat completion with real OpenAI compatible API
   */
  async createChatCompletion(_teamId: string, params: AgentV2ChatParams, agentId?: string): Promise<any> {
    try {
      const openaiParams: OpenAI.Chat.ChatCompletionCreateParams = {
        model: params.model || 'gpt-3.5-turbo',
        messages: params.messages,
        stream: params.stream ?? true,
        temperature: params.temperature ?? 0.7,
        max_tokens: params.max_tokens ?? 4096,
      };

      // Add tools if specified - resolve tools for agent
      if (params.tools && params.tools.length > 0 && agentId) {
        openaiParams.tools = await this.resolveToolsForAgent(agentId, params.tools);
        openaiParams.tool_choice = openaiParams.tools.length > 0 ? 'auto' : undefined;
      }

      this.logger.log(`📤 [LLM] ${openaiParams.model} | ${openaiParams.messages.length} msgs | ${openaiParams.tools?.length || 0} tools`);

      const response = await this.openaiClient.chat.completions.create(openaiParams);

      return response;
    } catch (error) {
      this.logger.error(`Error creating chat completion: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Resolve tools for agent with permission check
   */
  private async resolveToolsForAgent(agentId: string, requestedTools: string[]): Promise<OpenAI.Chat.ChatCompletionTool[]> {
    const tools: OpenAI.Chat.ChatCompletionTool[] = [];

    for (const toolName of requestedTools) {
      // Always allow builtin tools
      if (isAgentV2BuiltinTool(toolName)) {
        const builtinTool = this.convertBuiltinToolToOpenAI(toolName);
        if (builtinTool) {
          tools.push(builtinTool);
        }
        continue;
      }

      // Check permission for external tools
      const hasPermission = await this.checkExternalToolPermission(agentId, toolName);
      if (hasPermission) {
        const externalTool = await this.convertExternalToolToOpenAI(toolName);
        if (externalTool) {
          tools.push(externalTool);
        }
      }
    }

    return tools;
  }

  /**
   * Convert builtin tool to OpenAI format
   */
  private convertBuiltinToolToOpenAI(toolName: string): OpenAI.Chat.ChatCompletionTool | null {
    switch (toolName) {
      case 'use_mcp_tool':
        return {
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
        };
      case 'access_mcp_resource':
        return {
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
        };
      // ask_followup_question removed from AgentV2
      case 'attempt_completion':
        return {
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
        };
      case 'update_todo_list':
        return {
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
        };
      case 'web_search':
        return {
          type: 'function',
          function: {
            name: 'web_search',
            description: 'Search the internet for current information, news, or recent data. Use this for queries that require up-to-date information beyond your training data.',
            parameters: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'The search query - be specific and clear about what you are looking for',
                },
                scope: {
                  type: 'string',
                  enum: ['general', 'news', 'academic', 'local'],
                  description: 'The type of search to perform (optional, defaults to general)',
                },
              },
              required: ['query'],
            },
          },
        };
      default:
        return null;
    }
  }

  /**
   * Check external tool permission for agent
   */
  private async checkExternalToolPermission(agentId: string, toolName: string): Promise<boolean> {
    try {
      const agent = await this.agentRepository.findAgentById(agentId);
      if (!agent?.availableTools?.enabled) {
        return false;
      }
      return agent.availableTools.toolNames.includes(toolName);
    } catch (error) {
      this.logger.error(`Error checking tool permission: ${error.message}`);
      return false;
    }
  }

  /**
   * Convert external tool to OpenAI format
   */
  private async convertExternalToolToOpenAI(toolName: string): Promise<OpenAI.Chat.ChatCompletionTool | null> {
    try {
      const toolDef = await this.toolsRegistryService.getToolByName(toolName);

      if (!toolDef) {
        this.logger.warn(`External tool ${toolName} not found`);
        return null;
      }

      // Convert tool name (借鉴旧智能体的做法，替换冒号为双下划线)
      const convertedName = toolName.replaceAll(':', '__');

      // Handle displayName and description types
      const displayName = this.extractLocalizedText(toolDef.displayName, toolName);
      const description = this.extractLocalizedText(toolDef.description, `External tool: ${displayName}`);

      return {
        type: 'function',
        function: {
          name: convertedName,
          description: description,
          parameters: this.convertToolInputToJsonSchema(toolDef.input || []),
        },
      };
    } catch (error) {
      this.logger.error(`Error converting external tool ${toolName}: ${error.message}`);
      return null;
    }
  }

  /**
   * Convert tool input properties to JSON schema format
   */
  private convertToolInputToJsonSchema(inputProperties: any[]): any {
    const properties: any = {};
    const required: string[] = [];

    inputProperties.forEach((prop) => {
      if (prop.name) {
        properties[prop.name] = {
          type: this.mapPropertyType(prop.type),
          description: this.extractLocalizedText(prop.description, '') || this.extractLocalizedText(prop.displayName, '') || prop.name,
        };

        // Handle enum values
        if (prop.options && Array.isArray(prop.options)) {
          properties[prop.name].enum = prop.options.map((opt: any) => opt.value || opt);
        }

        // Add to required if specified
        if (prop.required) {
          required.push(prop.name);
        }
      }
    });

    return {
      type: 'object',
      properties,
      required: required.length > 0 ? required : undefined,
    };
  }

  /**
   * Map tool property types to JSON schema types
   */
  private mapPropertyType(type: string): string {
    switch (type) {
      case 'number':
        return 'number';
      case 'boolean':
        return 'boolean';
      case 'array':
        return 'array';
      case 'object':
        return 'object';
      default:
        return 'string';
    }
  }
}
