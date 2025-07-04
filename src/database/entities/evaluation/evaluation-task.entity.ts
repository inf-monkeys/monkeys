import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../base/base';

export enum TaskStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum TaskType {
  EVALUATE_BATTLE_GROUP = 'evaluate_battle_group',
  ADD_ASSETS_TO_MODULE = 'add_assets_to_module',
}

@Entity({ name: 'evaluation_tasks' })
@Index(['status', 'createdTimestamp']) // 优化队列查询
@Index(['teamId', 'status']) // 多租户隔离 + 状态查询
@Index(['moduleId', 'status']) // 优化模块任务查询
@Index(['status', 'heartbeatAt']) // 优化任务恢复查询
@Index(['processorId', 'status']) // 分布式实例隔离
export class EvaluationTaskEntity extends BaseEntity {
  @Column({ type: 'enum', enum: TaskType })
  type: TaskType;

  @Column({ name: 'module_id' })
  moduleId: string;

  @Column({ name: 'team_id' })
  teamId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ type: 'enum', enum: TaskStatus, default: TaskStatus.PENDING })
  status: TaskStatus;

  @Column({ name: 'started_at', type: 'timestamp', nullable: true })
  startedAt?: Date;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt?: Date;

  @Column({ type: 'text', nullable: true })
  error?: string;

  // 分布式和可恢复性支持
  @Column({ name: 'processor_id', type: 'varchar', nullable: true })
  processorId?: string; // 处理实例ID

  @Column({ name: 'heartbeat_at', type: 'timestamp', nullable: true })
  heartbeatAt?: Date; // 心跳时间，用于检测僵尸任务

  @Column({ name: 'retry_count', type: 'int', default: 0 })
  retryCount: number; // 重试次数

  @Column({ name: 'max_retries', type: 'int', default: 3 })
  maxRetries: number; // 最大重试次数

  @Column({ name: 'timeout_minutes', type: 'int', default: 30 })
  timeoutMinutes: number; // 任务超时时间（分钟）

  // 进度信息
  @Column({ type: 'int', default: 0 })
  total: number;

  @Column({ type: 'int', default: 0 })
  completed: number;

  @Column({ type: 'int', default: 0 })
  failed: number;

  @Column({ name: 'current_item', type: 'varchar', nullable: true })
  currentItem?: string;

  // 任务载荷（JSON格式）
  @Column({ type: 'jsonb' })
  payload: {
    battleGroupId?: string;
    assetIds?: string[];
    [key: string]: any;
  };

  // 计算进度百分比
  get percentage(): number {
    return this.total > 0 ? Math.round((this.completed / this.total) * 100) : 0;
  }

  // 检查任务是否超时
  get isTimedOut(): boolean {
    if (!this.heartbeatAt || this.status !== TaskStatus.PROCESSING) {
      return false;
    }
    const timeoutMs = this.timeoutMinutes * 60 * 1000;
    return Date.now() - this.heartbeatAt.getTime() > timeoutMs;
  }

  // 检查是否可以重试
  get canRetry(): boolean {
    return this.retryCount < this.maxRetries;
  }
}
