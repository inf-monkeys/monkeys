import { config } from '@/common/config';
import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { SYSTEM_NAMESPACE } from '../../../../database/entities/tools/tools-server.entity';
import { ToolsForwardService } from '../../../tools/tools.forward.service';
import { ToolsRegistryService } from '../../../tools/tools.registry.service';
import { AGENT_V2_BUILTIN_TOOLS, isAgentV2BuiltinTool } from '../../constants/tools.constants';
import { AgentV2TaskStateManager } from '../agent-v2-task-state-manager.service';
import { AgentV2Repository } from '../agent-v2.repository';
import { AgentV2McpService } from '../mcp/agent-v2-mcp.service';
import { AskApproval, HandleError, PushToolResult, ToolResult, ToolUse } from '../types/tool-types';

@Injectable()
export class AgentV2ToolsService {
  private readonly logger = new Logger(AgentV2ToolsService.name);

  private openaiClient: OpenAI;

  constructor(
    private readonly mcpService: AgentV2McpService,
    private readonly taskStateManager: AgentV2TaskStateManager,
    private readonly toolsForwardService: ToolsForwardService,
    private readonly toolsRegistryService: ToolsRegistryService,
    private readonly agentRepository: AgentV2Repository,
  ) {
    // Initialize OpenAI client for web search
    const agentConfig = config.agentv2?.openaiCompatible;
    if (agentConfig?.apiKey && agentConfig?.url) {
      this.openaiClient = new OpenAI({
        apiKey: agentConfig.apiKey,
        baseURL: agentConfig.url,
      });
    }
  }

  // Generic tool execution method with agent permission check
  async executeTool(
    toolName: string,
    params: any,
    sessionId: string,
    askApproval: AskApproval,
    handleError: HandleError,
    pushToolResult: PushToolResult,
    agentId?: string,
    teamId?: string,
    userId?: string,
  ): Promise<ToolResult> {
    const toolCall: ToolUse = {
      id: `tool_${Date.now()}`,
      name: toolName,
      input: params,
    };

    const result: ToolResult = {
      tool_call_id: toolCall.id,
      output: '',
    };

    // Check if it's a builtin tool (always allowed) or external tool (requires permission)
    try {
      if (isAgentV2BuiltinTool(toolName)) {
        // Execute builtin tools and get the actual result
        const builtinResult = await this.executeBuiltinToolWithResult(toolCall, toolName, sessionId, askApproval, handleError, pushToolResult);
        result.output = builtinResult.output;
        result.is_error = builtinResult.is_error;
      } else {
        // Check permission for external tools
        if (agentId && !(await this.checkExternalToolPermission(agentId, toolName))) {
          result.is_error = true;
          result.output = `工具 ${toolName} 未被授权使用`;
          return result;
        }

        // Execute external tool
        const externalResult = await this.executeExternalTool(toolName, params, sessionId, teamId, userId);
        result.output = externalResult.output;
        result.is_error = externalResult.is_error;
      }
    } catch (error) {
      result.is_error = true;
      result.output = `Error executing ${toolName}: ${error.message}`;
      this.logger.error(`Tool execution error: ${error.message}`, error.stack);
    }

    return result;
  }

  // Execute builtin tools and return result
  private async executeBuiltinToolWithResult(
    toolCall: ToolUse,
    toolName: string,
    sessionId: string,
    askApproval: AskApproval,
    handleError: HandleError,
    pushToolResult: PushToolResult,
  ): Promise<ToolResult> {
    switch (toolName) {
      case 'use_mcp_tool':
        // Create a result collector for MCP tool
        let mcpResult: ToolResult = { tool_call_id: toolCall.id, output: '' };
        const mcpPushResult = (result: ToolResult) => {
          mcpResult = result;
        };
        await this.useMcpToolTool(toolCall, askApproval, handleError, mcpPushResult);
        return mcpResult;
      case 'access_mcp_resource':
        let resourceResult: ToolResult = { tool_call_id: toolCall.id, output: '' };
        const resourcePushResult = (result: ToolResult) => {
          resourceResult = result;
        };
        await this.accessMcpResourceTool(toolCall, askApproval, handleError, resourcePushResult);
        return resourceResult;
      case 'ask_followup_question':
        let followupResult: ToolResult = { tool_call_id: toolCall.id, output: '' };
        const followupPushResult = (result: ToolResult) => {
          followupResult = result;
        };
        await this.askFollowupQuestionTool(toolCall, askApproval, handleError, followupPushResult);
        return followupResult;
      case 'attempt_completion':
        let completionResult: ToolResult = { tool_call_id: toolCall.id, output: '' };
        const completionPushResult = (result: ToolResult) => {
          completionResult = result;
        };
        await this.attemptCompletionTool(toolCall, askApproval, handleError, completionPushResult);
        return completionResult;
      case 'new_task':
        let taskResult: ToolResult = { tool_call_id: toolCall.id, output: '' };
        const taskPushResult = (result: ToolResult) => {
          taskResult = result;
        };
        await this.newTaskTool(toolCall, askApproval, handleError, taskPushResult);
        return taskResult;
      case 'update_todo_list':
        return await this.updateTodoListTool(toolCall, sessionId, askApproval, handleError, pushToolResult);
      case 'web_search':
        return await this.webSearchTool(toolCall, askApproval, handleError, pushToolResult);
      default:
        throw new Error(`Unknown builtin tool: ${toolName}`);
    }
  }

  // Check external tool permission
  private async checkExternalToolPermission(agentId: string, toolName: string): Promise<boolean> {
    try {
      const agent = await this.agentRepository.findAgentById(agentId);
      if (!agent?.availableTools?.enabled) {
        return false; // 未启用外部工具
      }

      // Convert tool name back to original format (double underscore -> colon)
      // This is needed because LLM service converts ":" to "__" for function names
      const originalToolName = toolName.replaceAll('__', ':');

      // Check both formats for backward compatibility
      return agent.availableTools.toolNames.includes(toolName) || agent.availableTools.toolNames.includes(originalToolName);
    } catch (error) {
      this.logger.error(`Error checking tool permission: ${error.message}`);
      return false;
    }
  }

  // Execute external tool
  private async executeExternalTool(toolName: string, params: any, sessionId: string, teamId?: string, userId?: string): Promise<ToolResult> {
    try {
      // Convert tool name back to original format for execution
      // This is needed because LLM service converts ":" to "__" for function names
      const originalToolName = toolName.replaceAll('__', ':');

      const result = await this.toolsForwardService.invoke(originalToolName, params, { sessionId, teamId, userId });
      return {
        tool_call_id: `tool_${Date.now()}`,
        output: typeof result === 'string' ? result : JSON.stringify(result),
      };
    } catch (error) {
      this.logger.error(`External tool execution failed: ${error.message}`);
      return {
        tool_call_id: `tool_${Date.now()}`,
        output: `执行外部工具 ${toolName} 失败: ${error.message}`,
        is_error: true,
      };
    }
  }

  // Helper method to extract localized text
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

  // Get available tools for agent
  async getAvailableToolsForAgent(agentId: string): Promise<{
    builtin: Array<{ name: string; displayName: string; description: string; builtin: boolean }>;
    external: {
      enabled: string[];
      available: Array<{ name: string; displayName: string; description: string; namespace: string }>;
    };
  }> {
    const agent = await this.agentRepository.findAgentById(agentId);

    // Get all external tools from tools registry
    const allExternalTools = await this.toolsRegistryService.listTools(agent.teamId);
    const externalToolsInfo = allExternalTools
      .filter(
        (tool) => !isAgentV2BuiltinTool(tool.name) && tool.namespace !== SYSTEM_NAMESPACE, // 排除系统工具
      )
      .map((tool) => ({
        name: tool.name,
        displayName: this.extractLocalizedText(tool.displayName, tool.name),
        description: this.extractLocalizedText(tool.description, ''),
        namespace: tool.namespace,
      }));

    // Format builtin tools info
    const builtinToolsInfo = AGENT_V2_BUILTIN_TOOLS.map((name) => ({
      name,
      displayName: name.replace(/_/g, ' ').toUpperCase(),
      description: `内置${name}工具`,
      builtin: true,
    }));

    return {
      builtin: builtinToolsInfo,
      external: {
        enabled: agent?.availableTools?.enabled ? agent.availableTools.toolNames : [],
        available: externalToolsInfo,
      },
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async useMcpToolTool(block: ToolUse, askApproval: AskApproval, handleError: HandleError, pushToolResult: PushToolResult): Promise<void> {
    const serverName: string | undefined = block.input.server_name;
    const toolName: string | undefined = block.input.tool_name;
    const args: string | undefined = block.input.arguments;

    try {
      if (!serverName) {
        const error = new Error('Missing server_name parameter');
        await handleError('using MCP tool', error);
        pushToolResult({
          tool_call_id: block.id,
          output: 'Error: Missing server_name parameter',
          is_error: true,
        });
        return;
      }

      if (!toolName) {
        const error = new Error('Missing tool_name parameter');
        await handleError('using MCP tool', error);
        pushToolResult({
          tool_call_id: block.id,
          output: 'Error: Missing tool_name parameter',
          is_error: true,
        });
        return;
      }

      let parsedArguments: Record<string, unknown> | undefined;
      if (args) {
        try {
          parsedArguments = JSON.parse(args);
        } catch (error) {
          this.logger.error(`Failed to parse MCP tool arguments: ${error.message}`);
          pushToolResult({
            tool_call_id: block.id,
            output: `Error: Invalid JSON arguments format`,
            is_error: true,
          });
          return;
        }
      }

      // Get user approval
      const approvalMessage = JSON.stringify({
        type: 'use_mcp_tool',
        serverName,
        toolName,
        arguments: args,
      });

      const didApprove = await askApproval('use_mcp_tool', approvalMessage);
      if (!didApprove) {
        pushToolResult({
          tool_call_id: block.id,
          output: 'User declined MCP tool execution',
        });
        return;
      }

      // Execute the MCP tool using the actual MCP service
      const toolResult = await this.mcpService.callTool(serverName, toolName, parsedArguments);

      const resultText = toolResult?.content ? toolResult.content.map((item: any) => (item.type === 'text' ? item.text : '')).join('\\n\\n') : 'No response';

      pushToolResult({
        tool_call_id: block.id,
        output: resultText,
      });
    } catch (error) {
      await handleError('executing MCP tool', error);
      pushToolResult({
        tool_call_id: block.id,
        output: `Error: ${error.message}`,
        is_error: true,
      });
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async accessMcpResourceTool(block: ToolUse, askApproval: AskApproval, handleError: HandleError, pushToolResult: PushToolResult): Promise<void> {
    const serverName: string | undefined = block.input.server_name;
    const uri: string | undefined = block.input.uri;

    try {
      if (!serverName) {
        pushToolResult({
          tool_call_id: block.id,
          output: 'Error: Missing server_name parameter',
          is_error: true,
        });
        return;
      }

      if (!uri) {
        pushToolResult({
          tool_call_id: block.id,
          output: 'Error: Missing uri parameter',
          is_error: true,
        });
        return;
      }

      // Get user approval
      const approvalMessage = JSON.stringify({
        type: 'access_mcp_resource',
        serverName,
        uri,
      });

      const didApprove = await askApproval('use_mcp_tool', approvalMessage);
      if (!didApprove) {
        pushToolResult({
          tool_call_id: block.id,
          output: 'User declined MCP resource access',
        });
        return;
      }

      // Access the MCP resource using the actual MCP service
      const resourceResult = await this.mcpService.readResource(serverName, uri);

      const resultText =
        resourceResult?.contents
          ?.map((item: any) => item.text || '')
          .filter(Boolean)
          .join('\\n\\n') || 'Empty response';

      pushToolResult({
        tool_call_id: block.id,
        output: resultText,
      });
    } catch (error) {
      await handleError('accessing MCP resource', error);
      pushToolResult({
        tool_call_id: block.id,
        output: `Error: ${error.message}`,
        is_error: true,
      });
    }
  }

  async askFollowupQuestionTool(
    block: ToolUse,
    _askApproval: AskApproval,
    handleError: HandleError,
    pushToolResult: PushToolResult,
    askFollowupQuestion?: (question: string, suggestions?: Array<{ answer: string; mode?: string }>) => Promise<string>,
  ): Promise<void> {
    const question: string | undefined = block.input.question;
    const followUp: string | undefined = block.input.follow_up;

    try {
      if (!question) {
        pushToolResult({
          tool_call_id: block.id,
          output: 'Error: Missing question parameter',
          is_error: true,
        });
        return;
      }

      let suggestions: Array<{ answer: string; mode?: string }> = [];

      if (followUp) {
        try {
          // Parse the follow_up suggestions (simplified XML parsing)
          suggestions = this.parseFollowUpSuggestions(followUp);
        } catch (error) {
          this.logger.error(`Failed to parse follow-up suggestions: ${error.message}`);
          pushToolResult({
            tool_call_id: block.id,
            output: 'Error: Invalid follow-up suggestions format',
            is_error: true,
          });
          return;
        }
      }

      // Check if we have the askFollowupQuestion callback (proper interactive mode)
      if (askFollowupQuestion) {
        // Ask the user the question and wait for response
        const userAnswer = await askFollowupQuestion(question, suggestions);

        // Add user response to the tool result
        pushToolResult({
          tool_call_id: block.id,
          output: `<answer>\n${userAnswer}\n</answer>`,
        });
      } else {
        // Fallback mode - just return the question for non-interactive sessions
        pushToolResult({
          tool_call_id: block.id,
          output: `Question: ${question}${suggestions.length > 0 ? '\nSuggestions: ' + suggestions.map((s) => s.answer).join(', ') : ''}`,
        });

        this.logger.warn('askFollowupQuestion called without interactive callback - returned question directly');
      }
    } catch (error) {
      await handleError('asking follow-up question', error);
      pushToolResult({
        tool_call_id: block.id,
        output: `Error: ${error.message}`,
        is_error: true,
      });
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async attemptCompletionTool(block: ToolUse, _askApproval: AskApproval, handleError: HandleError, pushToolResult: PushToolResult): Promise<void> {
    const result: string | undefined = block.input.result;

    try {
      if (!result) {
        pushToolResult({
          tool_call_id: block.id,
          output: 'Error: Missing result parameter',
          is_error: true,
        });
        return;
      }

      // Completion logic will be handled by the persistent execution context
      // Just send the tool result
      pushToolResult({
        tool_call_id: block.id,
        output: `Task completed: ${result}`,
      });
    } catch (error) {
      await handleError('attempting completion', error);
      pushToolResult({
        tool_call_id: block.id,
        output: `Error: ${error.message}`,
        is_error: true,
      });
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async newTaskTool(block: ToolUse, askApproval: AskApproval, handleError: HandleError, pushToolResult: PushToolResult): Promise<void> {
    const message: string | undefined = block.input.message;

    try {
      if (!message) {
        pushToolResult({
          tool_call_id: block.id,
          output: 'Error: Missing message parameter',
          is_error: true,
        });
        return;
      }

      // Get approval for creating new task
      const approvalMessage = JSON.stringify({
        tool: 'newTask',

        content: message,
      });

      const didApprove = await askApproval('tool', approvalMessage);
      if (!didApprove) {
        pushToolResult({
          tool_call_id: block.id,
          output: 'User declined to create new task',
        });
        return;
      }

      // In a full implementation, this would create a new session/task

      pushToolResult({
        tool_call_id: block.id,
        output: `New task acknowledged: ${message}`,
      });
    } catch (error) {
      await handleError('creating new task', error);
      pushToolResult({
        tool_call_id: block.id,
        output: `Error: ${error.message}`,
        is_error: true,
      });
    }
  }

  async updateTodoListTool(block: ToolUse, sessionId: string, askApproval: AskApproval, handleError: HandleError, pushToolResult: PushToolResult): Promise<ToolResult> {
    const todos: string | undefined = block.input.todos;

    try {
      if (!todos) {
        const errorResult: ToolResult = {
          tool_call_id: block.id,
          output: 'Error: Missing todos parameter',
          is_error: true,
        };
        pushToolResult(errorResult);
        return errorResult;
      }

      // Get approval for updating todo list
      const approvalMessage = JSON.stringify({
        tool: 'updateTodoList',
        todosPreview: todos.substring(0, 200) + (todos.length > 200 ? '...' : ''),
      });

      const didApprove = await askApproval('tool', approvalMessage);
      if (!didApprove) {
        const declinedResult: ToolResult = {
          tool_call_id: block.id,
          output: 'User declined to update todo list',
        };
        pushToolResult(declinedResult);
        return declinedResult;
      }

      // Update task state using the task state manager
      const taskState = this.taskStateManager.updateSessionTaskState(sessionId, todos);

      // Generate continuation message based on task state
      const continuationMessage = this.taskStateManager.generateContinuationMessage(taskState);

      // Create comprehensive result message
      let resultOutput = `Todo list updated successfully!\n\nTask Status:\n`;
      resultOutput += `- Total tasks: ${taskState.todos.length}\n`;
      resultOutput += `- Completed: ${taskState.todos.filter((t) => t.status === 'completed').length}\n`;
      resultOutput += `- In Progress: ${taskState.todos.filter((t) => t.status === 'in_progress').length}\n`;
      resultOutput += `- Pending: ${taskState.todos.filter((t) => t.status === 'pending').length}\n\n`;

      // Add the continuation message that will guide the next action
      resultOutput += `${continuationMessage}`;

      const successResult: ToolResult = {
        tool_call_id: block.id,
        output: resultOutput,
      };

      pushToolResult(successResult);
      return successResult;
    } catch (error) {
      await handleError('updating todo list', error);
      const errorResult: ToolResult = {
        tool_call_id: block.id,
        output: `Error: ${error.message}`,
        is_error: true,
      };
      pushToolResult(errorResult);
      return errorResult;
    }
  }

  // Helper methods
  private parseFollowUpSuggestions(followUp: string): Array<{ answer: string; mode?: string }> {
    // Simplified XML parsing for suggestions
    const suggestions: Array<{ answer: string; mode?: string }> = [];
    const suggestRegex = /<suggest(?:\s+mode=["']([^"']+)["'])?[^>]*>([^<]+)<\/suggest>/g;

    let match: RegExpMatchArray | null;
    while ((match = suggestRegex.exec(followUp)) !== null) {
      const suggestion: { answer: string; mode?: string } = {
        answer: match[2].trim(),
      };
      if (match[1]) {
        suggestion.mode = match[1];
      }
      suggestions.push(suggestion);
    }

    return suggestions;
  }

  async webSearchTool(block: ToolUse, askApproval: AskApproval, handleError: HandleError, pushToolResult: PushToolResult): Promise<ToolResult> {
    const query: string | undefined = block.input.query;
    const scope: string | undefined = block.input.scope;

    try {
      if (!query) {
        const errorResult: ToolResult = {
          tool_call_id: block.id,
          output: 'Error: Missing query parameter',
          is_error: true,
        };
        pushToolResult(errorResult);
        return errorResult;
      }

      // Check if web search is enabled
      const webSearchConfig = config.agentv2?.webSearch;
      if (!webSearchConfig?.enabled) {
        const errorResult: ToolResult = {
          tool_call_id: block.id,
          output: 'Error: Web search is disabled in configuration',
          is_error: true,
        };
        pushToolResult(errorResult);
        return errorResult;
      }

      // Check if OpenAI client is initialized
      if (!this.openaiClient) {
        const errorResult: ToolResult = {
          tool_call_id: block.id,
          output: 'Error: OpenAI client not configured for web search',
          is_error: true,
        };
        pushToolResult(errorResult);
        return errorResult;
      }

      // Get approval for web search
      const approvalMessage = JSON.stringify({
        tool: 'web_search',
        query: query,
        scope: scope || 'general',
      });

      const didApprove = await askApproval('web_search', approvalMessage);
      if (!didApprove) {
        const declinedResult: ToolResult = {
          tool_call_id: block.id,
          output: 'User declined web search request',
        };
        pushToolResult(declinedResult);
        return declinedResult;
      }

      // Prepare search query with scope context if provided
      let searchQuery = query;
      if (scope && scope !== 'general') {
        switch (scope) {
          case 'news':
            searchQuery = `Latest news: ${query}`;
            break;
          case 'academic':
            searchQuery = `Academic research papers: ${query}`;
            break;
          case 'local':
            searchQuery = `Local information: ${query}`;
            break;
        }
      }

      this.logger.log(`🔍 [SEARCH] "${searchQuery}"`);

      // Get search model from config
      const searchModel = config.agentv2?.openaiCompatible?.webSearchModel || 'gpt-4o-search-preview-2025-03-11';
      const maxTokens = webSearchConfig.maxTokensPerSearch || 2000;
      const timeout = webSearchConfig.timeout || 60000;

      // Perform the web search using the search-enabled model
      const searchResponse = (await Promise.race([
        this.openaiClient.chat.completions.create({
          model: searchModel,
          messages: [
            {
              role: 'user',
              content: searchQuery,
            },
          ],
          temperature: 0.3,
          max_tokens: maxTokens,
          stream: false,
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Search timeout')), timeout)),
      ])) as OpenAI.Chat.ChatCompletion;

      const searchContent = searchResponse.choices[0]?.message?.content;
      if (!searchContent) {
        const errorResult: ToolResult = {
          tool_call_id: block.id,
          output: 'Error: No search results returned',
          is_error: true,
        };
        pushToolResult(errorResult);
        return errorResult;
      }

      // Process the search result - remove <think> tags if present
      let processedContent = searchContent;
      if (searchContent.includes('<think>')) {
        // Remove the <think> section but keep the actual search results
        const thinkEndIndex = searchContent.indexOf('</think>');
        if (thinkEndIndex !== -1) {
          processedContent = searchContent.substring(thinkEndIndex + 8).trim();
        }
      }

      // Log result summary for monitoring
      this.logger.log(`📊 [SEARCH] ${processedContent.length} chars`);

      // Create successful result
      const successResult: ToolResult = {
        tool_call_id: block.id,
        output: `## Web Search Results\n\n**Query:** ${query}\n**Scope:** ${scope || 'general'}\n\n${processedContent}`,
      };

      pushToolResult(successResult);
      return successResult;
    } catch (error) {
      await handleError('performing web search', error);
      const errorResult: ToolResult = {
        tool_call_id: block.id,
        output: `Error performing web search: ${error.message}`,
        is_error: true,
      };
      pushToolResult(errorResult);
      return errorResult;
    }
  }
}
