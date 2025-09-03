import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter } from 'events';
import { ChatCompletionMessageParam } from 'openai/resources';
import { AgentV2SessionEntity } from '../../../database/entities/agent-v2/agent-v2-session.entity';
import { TaskExecutionStatus } from '../../../database/entities/agent-v2/agent-v2-task-state.entity';
import { AgentV2Entity } from '../../../database/entities/agent-v2/agent-v2.entity';
import { AgentV2ChatParams, AgentV2LlmService } from './agent-v2-llm.service';
import { AgentV2PersistentTaskManager } from './agent-v2-persistent-task-manager.service';
import { AgentV2Repository } from './agent-v2.repository';
import { ASK_MODE_SYSTEM_PROMPT } from './prompts/ask-mode-system';
import { AgentV2ToolsService } from './tools/agent-v2-tools.service';
import { AskApproval, HandleError, PushToolResult, ToolResult } from './types/tool-types';
import { AssistantMessageParser, ToolCall } from './utils/assistant-message-parser';

// Persistent execution context that relies entirely on database state
@Injectable()
export class AgentV2PersistentExecutionContext extends EventEmitter {
  // Add conditional logging for debugging
  private shouldLog = process.env.NODE_ENV !== 'production' || process.env.AGENT_V2_DEBUG === 'true';

  private debugLog(message: string): void {
    if (this.shouldLog) {
      this.logger.debug(message);
    }
  }
  private parser = new AssistantMessageParser();
  private isProcessingActive = false;
  private processingIntervalId?: NodeJS.Timeout;

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

      // Only process user messages through the agent loop (senderId should be the actual user ID, not 'user')
      if (nextMessage.senderId !== 'system' && nextMessage.senderId !== 'assistant') {
        await this.runLoop();
      } else {
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

    // Get current task state
    const taskState = await this.taskManager.getTaskState(this.session.id);

    // Only skip if the session was explicitly stopped or encountered an error
    // We continue processing even after attempt_completion since conversation can continue
    if (taskState?.status === TaskExecutionStatus.STOPPED || taskState?.status === TaskExecutionStatus.ERROR) {
      return;
    }

    // Load conversation history from database
    const messages = await this.repository.findMessagesBySession(this.session.id);
    const conversationHistory: ChatCompletionMessageParam[] = messages.messages.map((m) => ({
      role: m.isSystem ? 'assistant' : 'user',
      content: m.content,
    }));

    const systemPrompt = this.getSystemPrompt();

    const params: AgentV2ChatParams = {
      model: this.agent.config?.model || 'gpt-3.5-turbo',
      messages: [systemPrompt, ...conversationHistory],
      stream: true,
      tools: ['ask_followup_question', 'attempt_completion', 'update_todo_list'], // 添加核心任务管理工具
      temperature: this.agent.config?.temperature || 0.7,
      max_tokens: this.agent.config?.maxTokens || 4096,
    };

    try {
      const llmResponse = await this.llmService.createChatCompletion(this.agent.teamId, params);

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
            const convertedToolCalls = toolCalls.map((tc: any) => ({
              id: tc.id || `tool_${Date.now()}`,
              name: tc.function?.name || '',
              params: tc.function?.arguments ? JSON.parse(tc.function.arguments) : {},
            }));
            this.onToolCall?.(convertedToolCalls);
          }

          streamResult = await iterator.next();
        }

        // Process the complete message
        if (fullResponseText) {
          this.parser.processChunk(fullResponseText);
          this.parser.finalizeContentBlocks();
          const parsedContent = this.parser.getContentBlocks();

          const textContent = parsedContent.find((c) => c.type === 'text')?.['content'] || '';
          const toolCalls = parsedContent.filter((c) => c.type === 'tool_use').map((c) => c as any as ToolCall);

          // Save assistant response to database with tool calls
          if (textContent || toolCalls.length > 0) {
            await this.repository.createMessage({
              sessionId: this.session.id,
              senderId: this.session.userId,
              content: textContent || '[Tool Calls Only]',
              toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
              isSystem: true,
            });
          }

          // Handle tool calls
          if (toolCalls.length > 0) {
            this.onToolCall?.(toolCalls);
            await this.executeTools(toolCalls);

            // After attempt_completion, the current response is done but conversation continues
            // We don't check for COMPLETED status here anymore since we keep the session running
            // The session only ends when explicitly stopped or an error occurs

            // Continue processing (new loop will be triggered by message queue)
          } else {
            // No tools used - send error and queue for retry
            const noToolsMessage = `[ERROR] You did not use a tool in your previous response! Please retry with a tool use.

You MUST use a tool in every response. Available tools:
- attempt_completion: If you have completed the task
- ask_followup_question: If you need more information
- use_mcp_tool: To execute MCP tools
- access_mcp_resource: To access MCP resources
- new_task: To create a new task
- update_todo_list: To update task progress

Please use one of these tools in your next response.`;

            // Queue error message for processing
            await this.queueMessage(noToolsMessage, this.session.userId);

            // Update mistake count
            const currentState = await this.taskManager.getTaskState(this.session.id);
            await this.taskManager.updateTaskState(this.session.id, {
              consecutiveMistakeCount: (currentState?.consecutiveMistakeCount || 0) + 1,
            });
          }
        }
      }
    } catch (error) {
      this.logger.error(`Error in agent loop: ${error.message}`, error.stack);

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
          result = await this.agentToolsService.executeTool(tool.name, tool.params, this.askApproval, this.handleError, this.pushToolResult);
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
        senderId: this.session.userId,
        content: resultSummary,
        isSystem: true,
      });
    }

    // Clear processing context
    await this.taskManager.updateTaskState(this.session.id, {
      processingContext: null,
    });
  }

  private getSystemPrompt(): ChatCompletionMessageParam {
    return {
      role: 'system',
      content: ASK_MODE_SYSTEM_PROMPT,
    };
  }

  // Setup tool handlers with database persistence
  private setupToolHandlers() {
    this.askApproval = async (type: string, message?: string) => {
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

    this.pushToolResult = async (result: ToolResult) => {

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
        senderId: this.session.userId,
        content: userAnswer,
        isSystem: false,
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
