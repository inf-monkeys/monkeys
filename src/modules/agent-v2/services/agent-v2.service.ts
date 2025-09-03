import { Injectable, Logger } from '@nestjs/common';
import { AgentV2LlmService } from './agent-v2-llm.service';
import { AgentV2PersistentExecutionContext } from './agent-v2-persistent-execution-context.service';
import { AgentV2PersistentTaskManager } from './agent-v2-persistent-task-manager.service';
import { AgentV2Repository } from './agent-v2.repository';
import { AgentV2ToolsService } from './tools/agent-v2-tools.service';

@Injectable()
export class AgentV2Service {
  private readonly logger = new Logger(AgentV2Service.name);
  // Add conditional logging for debugging

  // Global session context registry for coordination
  private activeContexts = new Map<string, AgentV2PersistentExecutionContext>();

  // Global followup question promise resolvers
  private followupQuestionResolvers = new Map<string, (answer: string) => void>();

  constructor(
    private readonly repository: AgentV2Repository,
    private readonly llmService: AgentV2LlmService,
    private readonly agentToolsService: AgentV2ToolsService,
    private readonly taskManager: AgentV2PersistentTaskManager,
  ) {}

  public async startNewSession(
    agentId: string,
    userId: string,
    initialMessage: string,
    onMessage: (chunk: string) => void,
    onToolCall: (toolCalls: any[]) => void,
    onToolResult: (tool: any, result: any) => void,
    onComplete: (finalMessage: string) => void,
    onError: (error: Error) => void,
    onFollowupQuestion?: (question: string, suggestions?: Array<{ answer: string; mode?: string }>) => Promise<string>,
  ): Promise<AgentV2PersistentExecutionContext> {
    const agent = await this.repository.findAgentById(agentId);
    if (!agent) throw new Error(`Agent with ID ${agentId} not found.`);

    const session = await this.repository.createSession({
      agentId,
      userId,
      title: initialMessage.substring(0, 50),
    });

    // Log session start event (important for monitoring)
    this.logger.log(`Session started: ${session.id} for user ${userId} with agent ${agentId}`);

    const context = new AgentV2PersistentExecutionContext(agent, session, this.repository, this.llmService, this.agentToolsService, this.taskManager);

    // Store context in global registry
    this.activeContexts.set(session.id, context);

    context.onMessage = onMessage;
    context.onToolCall = onToolCall;
    context.onToolResult = onToolResult;
    context.onFollowupQuestion = onFollowupQuestion;
    context.onComplete = (finalMessage: string) => {
      // Don't remove from registry on attempt_completion - conversation continues
      // Only remove when session is explicitly stopped or encounters an error
      onComplete(finalMessage);
    };
    context.onError = (error: Error) => {
      // Remove from registry on error
      this.activeContexts.delete(session.id);
      onError(error);
    };

    // Start the conversation in the background - completely async like agent-code
    context.start(initialMessage).catch((error) => {
      this.activeContexts.delete(session.id);
      onError(error);
    });

    return context;
  }

  // Single message submission method - works for any session state
  public async submitUserMessage(sessionId: string, message: string, senderId: string = 'user'): Promise<void> {
    // Check if there's an active context
    const context = this.activeContexts.get(sessionId);

    if (context) {
      // Session is active - queue the message for processing
      await context.queueMessage(message, senderId);
      return;
    }

    // No active context - this could be resuming a session or starting a new conversation
    const session = await this.repository.findSessionById(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // Create a new message record and queue it through the task manager
    const messageEntity = await this.repository.createMessage({
      sessionId,
      senderId,
      content: message,
      isSystem: false,
    });

    // Queue through persistent task manager
    await this.taskManager.queueMessage(sessionId, messageEntity.id, message, senderId);
  }

  // Get active session context (useful for debugging/monitoring)
  public getActiveContext(sessionId: string): AgentV2PersistentExecutionContext | undefined {
    return this.activeContexts.get(sessionId);
  }

  // Stop a session
  public async stopSession(sessionId: string): Promise<void> {
    const context = this.activeContexts.get(sessionId);
    if (context) {
      context.stop();
      this.activeContexts.delete(sessionId);
      // Log session stop event (important for monitoring)
      this.logger.log(`Session stopped: ${sessionId}`);
    }
  }

  // Get all active session IDs
  public getActiveSessionIds(): string[] {
    return Array.from(this.activeContexts.keys());
  }

  // Get session task status from database
  public async getSessionTaskStatus(sessionId: string) {
    const taskState = await this.repository.getTaskState(sessionId);

    if (!taskState) {
      return {
        status: 'not_found',
        message: 'No task state found for this session',
      };
    }

    return {
      status: taskState.status,
      currentLoopCount: taskState.currentLoopCount,
      consecutiveMistakeCount: taskState.consecutiveMistakeCount,
      lastProcessedMessageId: taskState.lastProcessedMessageId,
      processingContext: taskState.processingContext,
      executionMetadata: taskState.executionMetadata,
      createdAt: taskState.createdAt,
      updatedAt: taskState.updatedAt,
    };
  }

  // Get session queue information
  public async getSessionQueueInfo(sessionId: string) {
    const queueInfo = await this.repository.getSessionQueueInfo(sessionId);

    return {
      totalQueued: queueInfo.totalQueued,
      totalProcessing: queueInfo.totalProcessing,
      totalProcessed: queueInfo.totalProcessed,
      totalFailed: queueInfo.totalFailed,
      oldestUnprocessed: queueInfo.oldestUnprocessed,
      newestMessage: queueInfo.newestMessage,
    };
  }

  // Resume a session - restart processing if there are queued messages
  public async resumeSession(sessionId: string): Promise<{
    resumed: boolean;
    message: string;
    queuedMessages: number;
  }> {
    const session = await this.repository.findSessionById(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // Check if already active
    if (this.activeContexts.has(sessionId)) {
      return {
        resumed: false,
        message: 'Session is already active',
        queuedMessages: 0,
      };
    }

    // Check for queued messages
    const queueInfo = await this.getSessionQueueInfo(sessionId);

    if (queueInfo.totalQueued === 0) {
      return {
        resumed: false,
        message: 'No queued messages to process',
        queuedMessages: 0,
      };
    }

    // Get agent and create new context
    const agent = await this.repository.findAgentById(session.agentId);
    if (!agent) {
      throw new Error(`Agent ${session.agentId} not found`);
    }

    // Create execution context but don't start with initial message
    const context = new AgentV2PersistentExecutionContext(agent, session, this.repository, this.llmService, this.agentToolsService, this.taskManager);

    // Store context in global registry
    this.activeContexts.set(session.id, context);

    // Set up callbacks (these would be no-ops for resume unless you want logging)
    context.onComplete = () => {
      // Don't remove from registry on attempt_completion - conversation continues
    };
    context.onError = (error: Error) => {
      this.activeContexts.delete(session.id);
      this.logger.error(`Resumed session ${sessionId} error: ${error.message}`);
    };

    // Start processing without initial message - just resume the processing loop
    context.resumeProcessing().catch((error: Error) => {
      this.activeContexts.delete(session.id);
      throw error;
    });

    // Log session resume event (important for monitoring)
    this.logger.log(`Session resumed: ${sessionId} with ${queueInfo.totalQueued} queued messages`);

    return {
      resumed: true,
      message: 'Session resumed successfully',
      queuedMessages: queueInfo.totalQueued,
    };
  }

  // Get session context usage and validate against limits
  public async getSessionContextUsage(sessionId: string) {
    const result = await this.repository.findMessagesBySession(sessionId);

    // Calculate total tokens used (approximate)
    let totalTokens = 0;
    let messageCount = 0;

    for (const message of result.messages) {
      // Simple token estimation: ~4 chars per token
      totalTokens += Math.ceil(message.content.length / 4);
      messageCount++;
    }

    // Get agent config to determine limits
    const session = await this.repository.findSessionById(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const agent = await this.repository.findAgentById(session.agentId);
    if (!agent) {
      throw new Error(`Agent ${session.agentId} not found`);
    }

    // Extract max tokens from agent config
    const agentConfig = agent.config as any;
    const maxTokens = agentConfig?.maxTokens || 4096;

    // Calculate usage percentage
    const usagePercentage = (totalTokens / maxTokens) * 100;
    const isNearLimit = usagePercentage > 80; // 80% threshold
    const isOverLimit = usagePercentage > 95; // 95% threshold for rejection

    return {
      sessionId,
      messageCount,
      estimatedTokens: totalTokens,
      maxTokens,
      usagePercentage: Math.round(usagePercentage * 100) / 100,
      isNearLimit,
      isOverLimit,
      canAcceptNewMessages: !isOverLimit,
      recommendedAction: isOverLimit ? 'context_limit_reached' : isNearLimit ? 'approaching_limit' : 'normal',
    };
  }

  // Validate message submission against context limits
  public async validateMessageSubmission(
    sessionId: string,
    messageContent: string,
  ): Promise<{
    canSubmit: boolean;
    reason?: string;
    contextUsage?: any;
  }> {
    try {
      const contextUsage = await this.getSessionContextUsage(sessionId);

      // Estimate tokens for new message
      const newMessageTokens = Math.ceil(messageContent.length / 4);
      const projectedTokens = contextUsage.estimatedTokens + newMessageTokens;
      const projectedPercentage = (projectedTokens / contextUsage.maxTokens) * 100;

      if (projectedPercentage > 95) {
        return {
          canSubmit: false,
          reason: 'Adding this message would exceed the context limit. Please start a new session.',
          contextUsage: {
            ...contextUsage,
            projectedTokens,
            projectedPercentage: Math.round(projectedPercentage * 100) / 100,
          },
        };
      }

      return {
        canSubmit: true,
        contextUsage: {
          ...contextUsage,
          projectedTokens,
          projectedPercentage: Math.round(projectedPercentage * 100) / 100,
        },
      };
    } catch (error) {
      // If we can't validate, err on the side of caution but allow
      this.logger.warn(`Failed to validate context for session ${sessionId}: ${error.message}`);
      return {
        canSubmit: true,
        reason: 'Context validation unavailable, proceeding with caution',
      };
    }
  }

  // Store a followup question resolver
  public storeFollowupQuestionResolver(sessionId: string, resolver: (answer: string) => void): void {
    this.followupQuestionResolvers.set(sessionId, resolver);
  }

  // Submit answer to a followup question
  public submitFollowupAnswer(sessionId: string, answer: string): boolean {
    const resolver = this.followupQuestionResolvers.get(sessionId);
    if (resolver) {
      resolver(answer);
      this.followupQuestionResolvers.delete(sessionId);
      return true;
    }
    return false;
  }

  // Check if session is waiting for followup answer
  public isWaitingForFollowup(sessionId: string): boolean {
    return this.followupQuestionResolvers.has(sessionId);
  }
}
