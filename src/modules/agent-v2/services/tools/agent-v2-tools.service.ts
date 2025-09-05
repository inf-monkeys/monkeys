import { Injectable, Logger } from '@nestjs/common';
import { AgentV2TaskStateManager } from '../agent-v2-task-state-manager.service';
import { AgentV2McpService } from '../mcp/agent-v2-mcp.service';
import { AskApproval, HandleError, PushToolResult, ToolResult, ToolUse } from '../types/tool-types';

@Injectable()
export class AgentV2ToolsService {
  private readonly logger = new Logger(AgentV2ToolsService.name);

  constructor(
    private readonly mcpService: AgentV2McpService,
    private readonly taskStateManager: AgentV2TaskStateManager,
  ) {}

  // Generic tool execution method
  async executeTool(toolName: string, params: any, sessionId: string, askApproval: AskApproval, handleError: HandleError, pushToolResult: PushToolResult): Promise<ToolResult> {
    const toolCall: ToolUse = {
      id: `tool_${Date.now()}`,
      name: toolName,
      input: params,
    };

    const result: ToolResult = {
      tool_call_id: toolCall.id,
      output: '',
    };

    // Route to appropriate tool handler
    try {
      switch (toolName) {
        case 'use_mcp_tool':
          await this.useMcpToolTool(toolCall, askApproval, handleError, pushToolResult);
          result.output = 'MCP tool executed successfully';
          break;
        case 'access_mcp_resource':
          await this.accessMcpResourceTool(toolCall, askApproval, handleError, pushToolResult);
          result.output = 'MCP resource accessed successfully';
          break;
        case 'ask_followup_question':
          await this.askFollowupQuestionTool(toolCall, askApproval, handleError, pushToolResult);
          result.output = 'Followup question asked successfully';
          break;
        case 'attempt_completion':
          await this.attemptCompletionTool(toolCall, askApproval, handleError, pushToolResult);
          result.output = 'Task completion attempted successfully';
          break;
        case 'new_task':
          await this.newTaskTool(toolCall, askApproval, handleError, pushToolResult);
          result.output = 'New task created successfully';
          break;
        case 'update_todo_list':
          const todoResult = await this.updateTodoListTool(toolCall, sessionId, askApproval, handleError, pushToolResult);
          result.output = todoResult.output;
          result.is_error = todoResult.is_error;
          break;
        default:
          throw new Error(`Unknown tool: ${toolName}`);
      }
    } catch (error) {
      result.is_error = true;
      result.output = `Error executing ${toolName}: ${error.message}`;
      this.logger.error(`Tool execution error: ${error.message}`, error.stack);
    }

    return result;
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

  private parseMarkdownTodoList(todos: string): Array<{ id: string; content: string; status: string }> {
    const lines = todos
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    const todoItems: Array<{ id: string; content: string; status: string }> = [];

    for (const line of lines) {
      const match = line.match(/^\[\s*([ xX\-~])\s*\]\s+(.+)$/);
      if (!match) continue;

      let status = 'pending';
      if (match[1] === 'x' || match[1] === 'X') status = 'completed';
      else if (match[1] === '-' || match[1] === '~') status = 'in_progress';

      const id = `todo_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      todoItems.push({
        id,
        content: match[2],
        status,
      });
    }

    return todoItems;
  }
}
