import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, UpdateDateColumn } from 'typeorm';

export enum TaskExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  WAITING_FOR_APPROVAL = 'waiting_for_approval',
  COMPLETED = 'completed',
  ERROR = 'error',
  STOPPED = 'stopped',
}

export enum MessageProcessingStatus {
  QUEUED = 'queued',
  PROCESSING = 'processing',
  PROCESSED = 'processed',
  FAILED = 'failed',
}

@Entity('agent_v2_task_states')
// Core query patterns optimized with indexes
@Index(['sessionId']) // Primary lookup
@Index(['sessionId', 'status']) // Status filtering
@Index(['sessionId', 'updatedAt']) // Recent state queries
@Index(['status', 'updatedAt']) // Global status monitoring
@Index(['sessionId', 'lastProcessedMessageId']) // Processing continuity
export class AgentV2TaskStateEntity {
  @PrimaryColumn({
    type: 'varchar',
    length: 128,
  })
  id: string;

  @Column({ name: 'session_id', type: 'varchar', length: 128 })
  sessionId: string;

  @Column({
    type: 'enum',
    enum: TaskExecutionStatus,
    default: TaskExecutionStatus.PENDING,
  })
  status: TaskExecutionStatus;

  @Column({ name: 'current_loop_count', default: 0 })
  currentLoopCount: number;

  @Column({ name: 'consecutive_mistake_count', default: 0 })
  consecutiveMistakeCount: number;

  @Column({ name: 'last_processed_message_id', type: 'varchar', length: 128, nullable: true })
  lastProcessedMessageId?: string;

  // JSONB fields for flexible metadata storage
  @Column({ name: 'processing_context', type: 'jsonb', nullable: true })
  processingContext?: {
    currentToolCalls?: any[];
    lastLLMResponse?: string;
    waitingForApproval?: boolean;
    errorMessage?: string;
  };

  @Column({ name: 'execution_metadata', type: 'jsonb', nullable: true })
  executionMetadata?: {
    totalTokensUsed?: number;
    toolsExecuted?: string[];
    startTime?: string;
    endTime?: string;
  };

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

@Entity('agent_v2_message_queue')
// Optimized for queue processing patterns
@Index(['sessionId', 'status', 'createdAt']) // Queue processing order
@Index(['sessionId', 'createdAt']) // Chronological order
@Index(['status', 'createdAt']) // Global queue monitoring
@Index(['sessionId', 'processedAt']) // Processing history
@Index(['messageId']) // Direct message lookup
@Index(['status', 'processingAttempts', 'updatedAt']) // Failed message retry
export class AgentV2MessageQueueEntity {
  @PrimaryColumn({
    type: 'varchar',
    length: 128,
  })
  id: string;

  @Column({ name: 'session_id', type: 'varchar', length: 128 })
  sessionId: string;

  @Column({ name: 'message_id', type: 'varchar', length: 128 })
  messageId: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'sender_id', type: 'varchar', length: 255 })
  senderId: string;

  @Column({
    type: 'enum',
    enum: MessageProcessingStatus,
    default: MessageProcessingStatus.QUEUED,
  })
  status: MessageProcessingStatus;

  @Column({ name: 'processing_attempts', default: 0 })
  processingAttempts: number;

  @Column({ name: 'processed_at', nullable: true })
  processedAt?: Date;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage?: string;

  @Column({ name: 'processing_result', type: 'jsonb', nullable: true })
  processingResult?: {
    llmResponse?: string;
    toolCallsTriggered?: any[];
    tokensUsed?: number;
  };

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
