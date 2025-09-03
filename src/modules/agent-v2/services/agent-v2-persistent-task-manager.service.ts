import { generateDbId } from '@/common/utils';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EventEmitter } from 'events';
import { Repository } from 'typeorm';
import { AgentV2MessageQueueEntity, AgentV2TaskStateEntity, MessageProcessingStatus, TaskExecutionStatus } from '../../../database/entities/agent-v2/agent-v2-task-state.entity';

@Injectable()
export class AgentV2PersistentTaskManager extends EventEmitter {
  private readonly logger = new Logger(AgentV2PersistentTaskManager.name);

  // Active processing instances - only for coordination, not for state storage
  private activeProcessors = new Set<string>();

  constructor(
    @InjectRepository(AgentV2TaskStateEntity)
    private readonly taskStateRepository: Repository<AgentV2TaskStateEntity>,
    @InjectRepository(AgentV2MessageQueueEntity)
    private readonly messageQueueRepository: Repository<AgentV2MessageQueueEntity>,
  ) {
    super();
  }

  // Initialize task state for a new session
  async initializeTaskState(sessionId: string): Promise<AgentV2TaskStateEntity> {
    const existingState = await this.taskStateRepository.findOne({
      where: { sessionId },
    });

    if (existingState) {
      return existingState;
    }

    const taskState = this.taskStateRepository.create({
      id: generateDbId(),
      sessionId,
      status: TaskExecutionStatus.PENDING,
      currentLoopCount: 0,
      consecutiveMistakeCount: 0,
    });

    return await this.taskStateRepository.save(taskState);
  }

  // Queue a message for processing - atomic database operation
  async queueMessage(sessionId: string, messageId: string, content: string, senderId: string): Promise<void> {
    const queueItem = this.messageQueueRepository.create({
      id: generateDbId(),
      sessionId,
      messageId,
      content,
      senderId,
      status: MessageProcessingStatus.QUEUED,
    });

    await this.messageQueueRepository.save(queueItem);


    // Emit event for potential processors
    this.emit('messageQueued', sessionId, messageId);
  }

  // Get next message to process (atomic with status update)
  async getNextMessageToProcess(sessionId: string): Promise<AgentV2MessageQueueEntity | null> {
    return await this.messageQueueRepository.manager.transaction(async (entityManager) => {
      const nextMessage = await entityManager.findOne(AgentV2MessageQueueEntity, {
        where: {
          sessionId,
          status: MessageProcessingStatus.QUEUED,
        },
        order: { createdAt: 'ASC' },
        lock: { mode: 'pessimistic_write' },
      });

      if (nextMessage) {
        nextMessage.status = MessageProcessingStatus.PROCESSING;
        nextMessage.processingAttempts += 1;
        await entityManager.save(nextMessage);
      }

      return nextMessage;
    });
  }

  // Mark message as processed with atomic task state update
  async markMessageProcessed(
    messageId: string,
    result?: any,
    taskStateUpdates?: Partial<{
      status: TaskExecutionStatus;
      currentLoopCount: number;
      consecutiveMistakeCount: number;
      lastProcessedMessageId: string;
      processingContext: any;
      executionMetadata: any;
    }>,
  ): Promise<void> {
    await this.messageQueueRepository.manager.transaction(async (entityManager) => {
      // Update message status atomically
      await entityManager.update(AgentV2MessageQueueEntity, messageId, {
        status: MessageProcessingStatus.PROCESSED,
        processedAt: new Date(),
        processingResult: result,
      });

      // Optionally update task state in same transaction for full consistency
      if (taskStateUpdates) {
        const message = await entityManager.findOne(AgentV2MessageQueueEntity, {
          where: { id: messageId },
          select: ['sessionId'],
        });

        if (message) {
          await entityManager.update(AgentV2TaskStateEntity, { sessionId: message.sessionId }, { ...taskStateUpdates, updatedAt: new Date() });
        }
      }
    });
  }

  // Mark message as failed
  async markMessageFailed(messageId: string, errorMessage: string): Promise<void> {
    await this.messageQueueRepository.update(messageId, {
      status: MessageProcessingStatus.FAILED,
      errorMessage,
      updatedAt: new Date(),
    });
  }

  // Update task execution state with optimistic concurrency control
  async updateTaskState(
    sessionId: string,
    updates: Partial<{
      status: TaskExecutionStatus;
      currentLoopCount: number;
      consecutiveMistakeCount: number;
      lastProcessedMessageId: string;
      processingContext: any;
      executionMetadata: any;
    }>,
  ): Promise<void> {
    await this.taskStateRepository.manager.transaction(async (entityManager) => {
      // Get current state with pessimistic lock to prevent race conditions
      const currentState = await entityManager.findOne(AgentV2TaskStateEntity, {
        where: { sessionId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!currentState) {
        throw new Error(`Task state not found for session ${sessionId}`);
      }

      // Apply updates atomically
      await entityManager.update(AgentV2TaskStateEntity, { sessionId }, { ...updates, updatedAt: new Date() });
    });

    this.logger.debug(`Task state updated for session ${sessionId}`);
    // Uncomment for debugging: this.logger.debug(`Updates: ${JSON.stringify(updates)}`);
  }

  // Get current task state
  async getTaskState(sessionId: string): Promise<AgentV2TaskStateEntity | null> {
    return await this.taskStateRepository.findOne({
      where: { sessionId },
    });
  }

  // Check if session has pending messages
  async hasPendingMessages(sessionId: string): Promise<boolean> {
    const count = await this.messageQueueRepository.count({
      where: {
        sessionId,
        status: MessageProcessingStatus.QUEUED,
      },
    });
    return count > 0;
  }

  // Register a processor for a session (for coordination only)
  registerProcessor(sessionId: string): boolean {
    if (this.activeProcessors.has(sessionId)) {
      return false; // Already being processed
    }

    this.activeProcessors.add(sessionId);
    return true;
  }

  // Unregister processor
  unregisterProcessor(sessionId: string): void {
    this.activeProcessors.delete(sessionId);
  }

  // Check if session is being processed
  isBeingProcessed(sessionId: string): boolean {
    return this.activeProcessors.has(sessionId);
  }

  // Resume task processing after server restart
  async getSessionsToResume(): Promise<string[]> {
    const activeStates = await this.taskStateRepository.find({
      where: {
        status: TaskExecutionStatus.RUNNING,
      },
      select: ['sessionId'],
    });

    return activeStates.map((state) => state.sessionId);
  }

  // Clean up failed/stuck processing states on startup
  async cleanupStaleProcessingStates(): Promise<void> {
    // Reset messages that were being processed but server crashed
    await this.messageQueueRepository.update({ status: MessageProcessingStatus.PROCESSING }, { status: MessageProcessingStatus.QUEUED });

    // Reset task states that were running but server crashed
    await this.taskStateRepository.update({ status: TaskExecutionStatus.RUNNING }, { status: TaskExecutionStatus.PENDING });

    this.logger.debug('Cleaned up stale processing states');
  }
}
