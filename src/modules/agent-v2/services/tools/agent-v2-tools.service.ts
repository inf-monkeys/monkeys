import { Injectable, Logger } from '@nestjs/common';
import { AgentV2McpService } from '../mcp/agent-v2-mcp.service';
import { AskApproval, HandleError, PushToolResult, ToolResult, ToolUse } from '../types/tool-types';

@Injectable()
export class AgentV2ToolsService {
  private readonly logger = new Logger(AgentV2ToolsService.name);

  constructor(private readonly mcpService: AgentV2McpService) {}

  // Generic tool execution method
  async executeTool(toolName: string, params: any, askApproval: AskApproval, handleError: HandleError, pushToolResult: PushToolResult): Promise<ToolResult> {
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
          await this.updateTodoListTool(toolCall, askApproval, handleError, pushToolResult);
          result.output = 'Todo list updated successfully';
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async updateTodoListTool(block: ToolUse, askApproval: AskApproval, handleError: HandleError, pushToolResult: PushToolResult): Promise<void> {
    const todos: string | undefined = block.input.todos;
    try {
      if (!todos) {
        pushToolResult({
          tool_call_id: block.id,
          output: 'Error: Missing todos parameter',
          is_error: true,
        });
        return;
      }

      // Parse the markdown todo list
      const parsedTodos = this.parseMarkdownTodoList(todos);

      // Get approval for updating todo list
      const approvalMessage = JSON.stringify({
        tool: 'updateTodoList',
        todos: parsedTodos,
      });

      const didApprove = await askApproval('tool', approvalMessage);
      if (!didApprove) {
        pushToolResult({
          tool_call_id: block.id,
          output: 'User declined to update todo list',
        });
        return;
      }

      // Todo list management will be handled by the persistent execution context
      // Just send the tool result

      pushToolResult({
        tool_call_id: block.id,
        output: 'Todo list updated successfully',
      });
    } catch (error) {
      await handleError('updating todo list', error);
      pushToolResult({
        tool_call_id: block.id,
        output: `Error: ${error.message}`,
        is_error: true,
      });
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
