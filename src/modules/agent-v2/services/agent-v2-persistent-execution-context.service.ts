import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter } from 'events';
import { ChatCompletionMessageParam } from 'openai/resources';
import { AgentV2SessionEntity } from '../../../database/entities/agent-v2/agent-v2-session.entity';
import { TaskExecutionStatus } from '../../../database/entities/agent-v2/agent-v2-task-state.entity';
import { AgentV2Entity } from '../../../database/entities/agent-v2/agent-v2.entity';
import { AgentV2ChatParams, AgentV2LlmService } from './agent-v2-llm.service';
import { AgentV2PersistentTaskManager } from './agent-v2-persistent-task-manager.service';
import { AgentV2TaskStateManager } from './agent-v2-task-state-manager.service';
import { AgentV2Repository } from './agent-v2.repository';
import { ASK_MODE_SYSTEM_PROMPT } from './prompts/ask-mode-system';
import { AgentV2ToolsService } from './tools/agent-v2-tools.service';
import { AskApproval, HandleError, PushToolResult, ToolResult } from './types/tool-types';
import { AssistantMessageParser, ToolCall } from './utils/assistant-message-parser';

// Persistent execution context that relies entirely on database state
@Injectable()
export class AgentV2PersistentExecutionContext extends EventEmitter {
  private readonly logger = new Logger(AgentV2PersistentExecutionContext.name);

  private parser = new AssistantMessageParser();
  private isProcessingActive = false;
  private processingIntervalId?: NodeJS.Timeout;
  private streamDetectedToolCalls: ToolCall[] = []; // Store tool calls detected during streaming

  // Callbacks for streaming updates
  public onMessage?: (chunk: string) => void;
  public onToolCall?: (toolCalls: ToolCall[]) => void;
  public onToolResult?: (tool: ToolCall, result: ToolResult) => void;
  public onComplete?: (finalMessage: string) => void;
  public onError?: (error: Error) => void;
  public onFollowupQuestion?: (question: string, suggestions?: Array<{ answer: string; mode?: string }>) => Promise<string>;

  constructor(
    public agent: AgentV2Entity,
    public session: AgentV2SessionEntity,
    private readonly repository: AgentV2Repository,
    private readonly llmService: AgentV2LlmService,
    private readonly agentToolsService: AgentV2ToolsService,
    private readonly taskManager: AgentV2PersistentTaskManager,
    private readonly taskStateManager: AgentV2TaskStateManager,
  ) {
    super();
    this.setupToolHandlers();
  }

  // Start the persistent task processing
  public async start(initialMessage: string) {
    try {
      // Initialize task state
      await this.taskManager.initializeTaskState(this.session.id);

      // Save initial message to database
      const message = await this.repository.createMessage({
        sessionId: this.session.id,
        senderId: this.session.userId,
        content: initialMessage,
        isSystem: false,
      });

      // Queue the message for processing
      await this.taskManager.queueMessage(this.session.id, message.id, initialMessage, this.session.userId);

      // Start the continuous processing loop
      await this.startPersistentProcessingLoop();
    } catch (e) {
      this.logger.error(`Error starting persistent task: ${e.message}`, e.stack);
      this.onError?.(e);
    }
  }

  // Queue a new message through the persistent manager
  public async queueMessage(content: string, senderId: string) {
    // Save to database first
    const message = await this.repository.createMessage({
      sessionId: this.session.id,
      senderId,
      content,
      isSystem: false,
    });

    // Queue for processing through persistent manager
    await this.taskManager.queueMessage(this.session.id, message.id, content, senderId);
  }

  // Queue a system message (uses session userId but marks as system)
  public async queueSystemMessage(content: string) {
    // Save to database first, using session userId but marking as system message
    const message = await this.repository.createMessage({
      sessionId: this.session.id,
      senderId: this.session.userId, // Use real user ID to satisfy foreign key constraint
      content,
      isSystem: true, // Mark as system message
    });

    // Queue for processing through persistent manager
    await this.taskManager.queueMessage(this.session.id, message.id, content, 'system');
  }

  // Stop the processing loop
  public stop() {
    this.isProcessingActive = false;

    if (this.processingIntervalId) {
      clearInterval(this.processingIntervalId);
      this.processingIntervalId = undefined;
    }

    // Unregister from persistent manager
    this.taskManager.unregisterProcessor(this.session.id);

    // Update task state to stopped
    this.taskManager.updateTaskState(this.session.id, {
      status: TaskExecutionStatus.STOPPED,
    });
  }

  // Resume processing without starting with a new initial message
  public async resumeProcessing() {
    try {
      await this.startPersistentProcessingLoop();
    } catch (error) {
      this.logger.error(`Error resuming persistent processing: ${error.message}`, error.stack);
      this.onError?.(error);
    }
  }

  // Database-driven processing loop that survives restarts
  private async startPersistentProcessingLoop() {
    // Register this processor with the persistent manager
    if (!this.taskManager.registerProcessor(this.session.id)) {
      return;
    }

    this.isProcessingActive = true;

    // Update task state to running
    await this.taskManager.updateTaskState(this.session.id, {
      status: TaskExecutionStatus.RUNNING,
    });

    // Start processing loop with database polling
    this.processingIntervalId = setInterval(async () => {
      if (!this.isProcessingActive) return;

      try {
        await this.processNextQueuedMessage();
      } catch (error) {
        this.logger.error(`Error in processing loop: ${error.message}`, error.stack);
        this.onError?.(error);
      }
    }, 500); // Poll every 500ms
  }

  // Process the next message from the database queue
  private async processNextQueuedMessage() {
    const nextMessage = await this.taskManager.getNextMessageToProcess(this.session.id);

    if (!nextMessage) {
      // No messages to process, check if task should be completed
      const taskState = await this.taskManager.getTaskState(this.session.id);
      const hasPending = await this.taskManager.hasPendingMessages(this.session.id);

      if (!hasPending && taskState?.status === TaskExecutionStatus.RUNNING) {
        // No pending messages and no active processing - task might be complete
        // Task completion will be handled by attempt_completion tool
      }
      return;
    }

    try {
      // Process user messages and system continuation messages through the agent loop
      // System continuation messages have senderId='system' in the queue
      if (nextMessage.senderId !== 'assistant') {
        await this.runLoop();
      }

      // Mark message as processed
      await this.taskManager.markMessageProcessed(nextMessage.id);

      // Update task state
      await this.taskManager.updateTaskState(this.session.id, {
        lastProcessedMessageId: nextMessage.id,
        currentLoopCount: (await this.taskManager.getTaskState(this.session.id))?.currentLoopCount + 1 || 1,
      });
    } catch (error) {
      this.logger.error(`Error processing message ${nextMessage.id}: ${error.message}`, error.stack);
      await this.taskManager.markMessageFailed(nextMessage.id, error.message);
      this.onError?.(error);
    }
  }

  // Run the agent loop - same logic as before but with database persistence
  private async runLoop() {
    // Reset stream-detected tool calls for this loop
    this.streamDetectedToolCalls = [];
    // Get current task state
    const taskState = await this.taskManager.getTaskState(this.session.id);

    // Only skip if the session was explicitly stopped or encountered an error
    // We continue processing even after attempt_completion since conversation can continue
    if (taskState?.status === TaskExecutionStatus.STOPPED || taskState?.status === TaskExecutionStatus.ERROR) {
      return;
    }

    // Load conversation history from database
    const messages = await this.repository.findMessagesBySession(this.session.id);
    const conversationHistory: ChatCompletionMessageParam[] = [];

    for (const m of messages.messages) {
      // Special handling for continuation messages - they should be system messages
      if (m.isSystem && m.content.startsWith('SYSTEM:')) {
        this.logger.log(`📋 [CONVERSATION] Converting continuation message to system role: ${m.content.substring(0, 100)}...`);
        conversationHistory.push({
          role: 'system' as const,
          content: m.content.replace(/^SYSTEM:\s*/, ''), // Remove "SYSTEM:" prefix
        });
        continue;
      }

      // Handle messages with tool calls (assistant messages that triggered tools)
      if (m.isSystem && m.toolCalls && Array.isArray(m.toolCalls) && m.toolCalls.length > 0) {
        // This is an assistant message with tool calls
        const toolCalls = m.toolCalls.map((tc: any) => ({
          id: tc.id || `call_${Date.now()}`,
          type: 'function' as const,
          function: {
            name: tc.name,
            arguments: JSON.stringify(tc.params || tc.input || {}),
          },
        }));

        conversationHistory.push({
          role: 'assistant' as const,
          content: m.content || null,
          tool_calls: toolCalls,
        });

        // Add tool result messages
        for (const tc of m.toolCalls) {
          if (tc.result) {
            conversationHistory.push({
              role: 'tool' as const,
              tool_call_id: tc.id || `call_${Date.now()}`,
              content: tc.result.success ? tc.result.output : `Error: ${tc.result.output}`,
            });
          }
        }
        continue;
      }

      // Handle tool result summary messages (created by executeTools method)
      if (m.isSystem && m.content.includes('[') && m.content.includes(']') && m.content.includes('web_search')) {
        // This looks like a tool result summary message, skip it as we already handled results above
        continue;
      }

      // Regular message mapping
      conversationHistory.push({
        role: m.isSystem ? 'assistant' : 'user',
        content: m.content,
      });
    }

    this.logger.log(`📝 [CONVERSATION] ${conversationHistory.length} messages`);

    const systemPrompt = await this.getContextAwareSystemPrompt();

    // 获取智能体可用的工具列表（包括内置和外部工具）
    const availableToolsConfig = await this.agentToolsService.getAvailableToolsForAgent(this.agent.id);
    const enabledTools: string[] = [
      // 内置工具始终可用
      ...availableToolsConfig.builtin.map((tool) => tool.name),
      // 已启用的外部工具
      ...availableToolsConfig.external.enabled,
    ];

    this.logger.log(`🛠️ [TOOLS] Available tools: ${enabledTools.join(', ')}`);

    const params: AgentV2ChatParams = {
      model: this.agent.config?.model || 'gpt-3.5-turbo',
      messages: [systemPrompt, ...conversationHistory],
      stream: true,
      tools: enabledTools,
      temperature: this.agent.config?.temperature || 0.7,
      max_tokens: this.agent.config?.maxTokens || 4096,
    };

    this.logger.log(`🚀 [LLM] ${params.model} request`);

    try {
      const llmResponse = await this.llmService.createChatCompletion(this.agent.teamId, params, this.agent.id);

      if (llmResponse && typeof llmResponse[Symbol.asyncIterator] === 'function') {
        // Handle streaming response
        let fullResponseText = '';
        const iterator = llmResponse[Symbol.asyncIterator]();
        let streamResult = await iterator.next();

        while (!streamResult.done) {
          const chunk = streamResult.value;

          if (chunk.choices && chunk.choices[0]?.delta?.content) {
            const content = chunk.choices[0].delta.content;
            fullResponseText += content;
            this.onMessage?.(content);
          }

          // Handle function calls
          if (chunk.choices && chunk.choices[0]?.delta?.tool_calls) {
            const toolCalls = chunk.choices[0].delta.tool_calls;
            this.logger.log(`🛠️ [STREAM] ${toolCalls.length} tool calls`);

            const convertedToolCalls = toolCalls.map((tc: any) => {
              let params = {};
              if (tc.function?.arguments) {
                try {
                  params = JSON.parse(tc.function.arguments);
                } catch (error) {
                  this.logger.warn(`Failed to parse tool arguments for ${tc.function?.name}: ${error.message}. Raw arguments: ${tc.function.arguments}`);
                  params = { _raw_arguments: tc.function.arguments };
                }
              }
              return {
                id: tc.id || `tool_${Date.now()}`,
                name: tc.function?.name || '',
                params,
              };
            });
            // Store tool calls detected during streaming
            this.streamDetectedToolCalls.push(...convertedToolCalls);
            this.onToolCall?.(convertedToolCalls);
          }

          streamResult = await iterator.next();
        }

        // Process the complete message - continue even if no text content but tool calls exist
        if (fullResponseText || this.streamDetectedToolCalls.length > 0) {
          this.parser.processChunk(fullResponseText);
          this.parser.finalizeContentBlocks();
          const parsedContent = this.parser.getContentBlocks();

          const textContent = parsedContent.find((c) => c.type === 'text')?.['content'] || '';
          // Use stream-detected tool calls instead of XML parsing for OpenAI function calls
          const toolCalls = this.streamDetectedToolCalls.length > 0 ? this.streamDetectedToolCalls : parsedContent.filter((c) => c.type === 'tool_use').map((c) => c as any as ToolCall);

          this.logger.log(`📝 [RESPONSE] ${toolCalls.length} tools, text: ${textContent ? 'yes' : 'no'}`);

          // Check for multiple tool calls - only allow exactly one
          if (toolCalls.length > 1) {
            const multipleToolsMessage = `[ERROR] You called ${toolCalls.length} tools in one response! You MUST call exactly ONE tool per response. 

Tools you attempted to call: ${toolCalls.map((t) => t.name).join(', ')}

Please retry with only ONE tool call.`;

            // Queue error message for processing as system message
            await this.queueSystemMessage(multipleToolsMessage);

            // Update mistake count
            const currentState = await this.taskManager.getTaskState(this.session.id);
            await this.taskManager.updateTaskState(this.session.id, {
              consecutiveMistakeCount: (currentState?.consecutiveMistakeCount || 0) + 1,
            });

            return; // Exit early, don't process any tools
          }

          // Save assistant response to database with tool calls
          if (textContent || toolCalls.length > 0) {
            await this.repository.createMessage({
              sessionId: this.session.id,
              senderId: this.session.userId, // Use real user ID to satisfy foreign key constraint
              content: textContent || '[Tool Calls Only]',
              toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
              isSystem: true, // Mark as assistant message (isSystem=true for non-user messages)
            });
          }

          // Handle tool calls
          if (toolCalls.length > 0) {
            this.logger.log(`🚀 [EXECUTE] ${toolCalls.length} tools`);
            this.onToolCall?.(toolCalls);
            await this.executeTools(toolCalls);

            // Add selective continuation for tools that should trigger follow-up actions
            // Only continue after web_search and specific update_todo_list cases to avoid infinite loops
            const shouldContinue = toolCalls.some((tool) => {
              // Never continue after attempt_completion to prevent loops
              if (tool.name === 'attempt_completion') {
                return false;
              }
              // Always continue after web_search to process results
              if (tool.name === 'web_search') {
                return true;
              }
              if (tool.name === 'update_todo_list') {
                // Continue if there are pending tasks, in-progress tasks to execute, or all tasks completed
                const taskState = this.taskStateManager.getSessionTaskState(this.session.id);
                return taskState?.nextAction === 'start_next_task' || taskState?.nextAction === 'continue_task' || taskState?.nextAction === 'all_completed';
              }
              // For any other external tool, continue to drive the next action
              return true;
            });

            if (shouldContinue) {
              this.logger.log(`🔄 [CONTINUATION] Continuing execution`);
              await this.queueSystemMessage('Continue with the next appropriate action based on the tool results.');
            }

            // After attempt_completion, the current response is done but conversation continues
            // We don't check for COMPLETED status here anymore since we keep the session running
            // The session only ends when explicitly stopped or an error occurs
          } else {
            // No tools used - send error and queue for retry
            const noToolsMessage = `[ERROR] You did not use a tool in your previous response! Please retry with a tool use.

You MUST use a tool in every response. Available tools:
- attempt_completion: If you have completed the task
- web_search: To search and gather information
- use_mcp_tool: To execute MCP tools
- access_mcp_resource: To access MCP resources
- new_task: To create a new task
- update_todo_list: To update task progress

Please use one of these tools in your next response.`;

            // Queue error message for processing as system message
            await this.queueSystemMessage(noToolsMessage);

            // Update mistake count
            const currentState = await this.taskManager.getTaskState(this.session.id);
            await this.taskManager.updateTaskState(this.session.id, {
              consecutiveMistakeCount: (currentState?.consecutiveMistakeCount || 0) + 1,
            });
          }
        }
      }
    } catch (error) {
      this.logger.error(`❌ [ERROR] Error in agent loop: ${error.message}`, error.stack);
      this.logger.error(`❌ [ERROR] Error occurred at: ${new Date().toISOString()}`);

      // Update task state with error
      await this.taskManager.updateTaskState(this.session.id, {
        status: TaskExecutionStatus.ERROR,
        processingContext: { errorMessage: error.message },
      });

      throw error;
    }
  }

  // Execute tools with database persistence
  private async executeTools(tools: ToolCall[]) {
    const toolResults: ToolResult[] = [];

    for (const tool of tools) {
      this.logger.log(`⚡ [TOOL] ${tool.name}`);
      try {
        // Save tool execution context to database
        await this.taskManager.updateTaskState(this.session.id, {
          processingContext: { currentToolCalls: [tool] },
        });

        let result: ToolResult;

        // Handle ask_followup_question specially with callback
        if (tool.name === 'ask_followup_question' && this.onFollowupQuestion) {
          result = await this.executeAskFollowupQuestionTool(tool);
        } else {
          result = await this.agentToolsService.executeTool(
            tool.name,
            tool.params,
            this.session.id,
            this.askApproval,
            this.handleError,
            this.pushToolResult,
            this.agent.id,
            this.agent.teamId,
            this.session.userId,
          );
        }

        if (result.is_error) {
          this.logger.error(`❌ [TOOL] ${tool.name}: ${result.output}`);
        }
        toolResults.push(result);

        // 发送工具执行结果的SSE事件
        this.onToolResult?.(tool, result);

        // Handle completion tool specially - but don't end the conversation
        if (tool.name === 'attempt_completion') {
          // Update task state to indicate current response is completed
          await this.taskManager.updateTaskState(this.session.id, {
            status: TaskExecutionStatus.RUNNING, // Keep running for continuous conversation
            executionMetadata: {
              lastResponseTime: new Date().toISOString(),
              toolsExecuted: tools.map((t) => t.name),
            },
          });

          // Send completion signal to UI (like agent-code's completion_result)
          this.onComplete?.(result.output || 'Response completed');

          // Don't return here - let the execution continue to handle more messages
          // The session stays active and ready for the next user message
          return;
        }

        // update_todo_list tool handling - update task state manager
        if (tool.name === 'update_todo_list') {
          this.logger.log(`📋 [TODO] Todo list updated - updating task state manager`);

          // Update task state manager with the original todos parameter, not the formatted output
          const todosMarkdown = tool.params?.todos || '';
          this.taskStateManager.updateSessionTaskState(this.session.id, todosMarkdown);
        }
      } catch (error) {
        this.logger.error(`Error executing tool ${tool.name}: ${error.message}`);

        const errorResult: ToolResult = {
          tool_call_id: tool.id || `error_${Date.now()}`,
          output: `Error executing ${tool.name}: ${error.message}`,
          is_error: true,
        };

        toolResults.push(errorResult);
      }
    }

    // Update the original message with tool execution results
    if (toolResults.length > 0) {
      // Find the latest message with tool calls to update with results
      const recentMessages = await this.repository.findMessagesBySession(this.session.id, { limit: 5 });
      const toolCallMessage = recentMessages.messages.reverse().find((msg) => msg.toolCalls && Array.isArray(msg.toolCalls) && msg.toolCalls.length > 0);

      if (toolCallMessage) {
        const updatedToolCalls = tools.map((tool, index) => ({
          ...tool,
          result: toolResults[index]
            ? {
                success: !toolResults[index].is_error,
                output: toolResults[index].output,
                timestamp: new Date().toISOString(),
              }
            : null,
        }));

        await this.repository.updateMessage(toolCallMessage.id, {
          toolCalls: updatedToolCalls,
        });
      }

      // Also create a summary message for easy reading in chat history
      const resultSummary = toolResults.map((result, index) => `[${tools[index].name}] ${result.is_error ? 'ERROR: ' : ''}${result.output}`).join('\n\n');

      await this.repository.createMessage({
        sessionId: this.session.id,
        senderId: this.session.userId, // Use real user ID to satisfy foreign key constraint
        content: resultSummary,
        isSystem: true, // Mark as system/tool result message
      });
    }

    // Clear processing context
    await this.taskManager.updateTaskState(this.session.id, {
      processingContext: null,
    });
  }

  private async getContextAwareSystemPrompt(): Promise<ChatCompletionMessageParam> {
    let contextualGuidance = '';

    // Get the latest user message to analyze intent
    const recentMessages = await this.repository.findMessagesBySession(this.session.id, { limit: 5 });
    const latestUserMessage = recentMessages.messages.find((msg) => !msg.isSystem)?.content || '';

    // For first-time requests without existing todos, check if it's a simple task
    const isFirstRequest = recentMessages.messages.length <= 1;
    const messageContainsWebSearchMention = latestUserMessage.toLowerCase().includes('web_search');
    if (isFirstRequest && messageContainsWebSearchMention) {
      contextualGuidance = `

DIRECT SEARCH GUIDANCE:
The user explicitly mentioned using web_search tool for current information. 
DO NOT create a todo list for this simple task.
Instead, directly use the web_search tool with an appropriate query.`;
    }

    // Analyze current task state to provide specific guidance
    const taskState = this.taskStateManager.getSessionTaskState(this.session.id);
    if (taskState) {
      const { todos, nextAction } = taskState;

      // Check for tasks that need execution
      const pendingTasks = todos.filter((todo) => todo.status === 'pending');
      const inProgressTasks = todos.filter((todo) => todo.status === 'in_progress');
      // Check if the last few messages show recent todo updates
      const recentMessages = await this.repository.findMessagesBySession(this.session.id, { limit: 3 });
      const recentlyUpdatedTodos = recentMessages.messages.filter((msg) => msg.isSystem && msg.toolCalls?.some((tc) => tc.name === 'update_todo_list')).length;

      if (nextAction === 'start_next_task' && pendingTasks.length > 0) {
        const nextTask = pendingTasks[0];
        contextualGuidance = `

TASK EXECUTION GUIDANCE:
You have a todo list with pending tasks. Execute the first pending task immediately:
"${nextTask.content}"

DO NOT call update_todo_list again. Use the appropriate action tool:
- If task involves searching/research → use web_search
- If task needs user input → use ask_followup_question
- Execute this task now!`;
      } else if (nextAction === 'continue_task' && inProgressTasks.length > 0) {
        const currentTask = inProgressTasks[0];
        contextualGuidance = `

CONTINUE TASK GUIDANCE:
Continue working on your in-progress task:
"${currentTask.content}"

Use the appropriate tool to complete this task:
- If it involves searching/research → use web_search
- If you need user clarification → use ask_followup_question`;
      } else if (nextAction === 'all_completed') {
        contextualGuidance = `

ALL TASKS COMPLETED GUIDANCE:
All tasks in your todo list are now completed! You MUST now use the attempt_completion tool to present the final result to the user.

CRITICAL: Use attempt_completion immediately with a comprehensive summary of all completed work.
DO NOT update the todo list or use any other tools. Your next action MUST be attempt_completion.`;
      } else if (recentlyUpdatedTodos > 0 && (pendingTasks.length > 0 || inProgressTasks.length > 0)) {
        contextualGuidance = `

EXECUTION PRIORITY:
You recently updated todos but haven't executed any tasks yet.
DO NOT update todos again. Focus on DOING the work:
- Execute pending/in-progress tasks using appropriate tools
- Use web_search for research tasks
- Use ask_followup_question for clarification needs`;
      }
    }

    return {
      role: 'system',
      content: ASK_MODE_SYSTEM_PROMPT + contextualGuidance,
    };
  }

  // Setup tool handlers with database persistence
  private setupToolHandlers() {
    this.askApproval = async () => {
      // Auto-approve all tool executions for continuous conversation
      return true;
    };

    this.handleError = async (action: string, error: Error) => {
      this.logger.error(`Error during ${action}: ${error.message}`, error.stack);

      // Update mistake count
      const currentState = await this.taskManager.getTaskState(this.session.id);
      await this.taskManager.updateTaskState(this.session.id, {
        consecutiveMistakeCount: (currentState?.consecutiveMistakeCount || 0) + 1,
      });
    };

    this.pushToolResult = async () => {
      // Results are already saved as messages in executeTools
      // This is just for logging/callback purposes
    };
  }

  // Special handler for ask_followup_question tool that uses the callback
  private async executeAskFollowupQuestionTool(tool: ToolCall): Promise<ToolResult> {
    const question: string | undefined = tool.params.question;
    const followUp: string | undefined = tool.params.follow_up;

    if (!question) {
      return {
        tool_call_id: tool.id,
        output: 'Error: Missing question parameter',
        is_error: true,
      };
    }

    if (!this.onFollowupQuestion) {
      return {
        tool_call_id: tool.id,
        output: 'Error: No followup question callback available',
        is_error: true,
      };
    }

    try {
      // Parse suggestions if provided
      let suggestions: Array<{ answer: string; mode?: string }> = [];
      if (followUp) {
        // Simple parsing logic (similar to the tools service)
        suggestions = this.parseFollowUpSuggestions(followUp);
      }

      // Call the callback and wait for user response
      const userAnswer = await this.onFollowupQuestion(question, suggestions);

      // Add the user's answer to the conversation
      await this.repository.createMessage({
        sessionId: this.session.id,
        senderId: this.session.userId, // Real user answer
        content: userAnswer,
        isSystem: false, // This is a real user message
      });

      return {
        tool_call_id: tool.id,
        output: `<answer>\n${userAnswer}\n</answer>`,
      };
    } catch (error) {
      this.logger.error(`Error in followup question: ${error.message}`, error.stack);
      return {
        tool_call_id: tool.id,
        output: `Error: ${error.message}`,
        is_error: true,
      };
    }
  }

  // Helper method to parse follow-up suggestions
  private parseFollowUpSuggestions(followUp: string): Array<{ answer: string; mode?: string }> {
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

  // Tool handler properties
  private askApproval: AskApproval;
  private handleError: HandleError;
  private pushToolResult: PushToolResult;
}
