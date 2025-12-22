import { config } from '@/common/config';
import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../base/base';
import { AgentEntity } from './agent.entity';
import { TeamEntity } from '../identity/team';
import { UserEntity } from '../identity/user';

const appId = config.server.appId;

/**
 * Thread 元数据结构
 * 暴露给 assistant-ui 的 thread extras
 */
export interface ThreadMetadata {
  /**
   * 当前使用的 Agent ID（可中途切换模型/agent）
   */
  currentAgentId?: string;

  /**
   * 当前使用的模型（逐消息可能不同）
   * 记录用于计费和审计
   */
  currentModel?: string;

  /**
   * 自定义标签（用于分类和筛选）
   */
  tags?: string[];

  /**
   * 来源信息（追踪对话来源）
   */
  source?: 'web' | 'api' | 'integration' | 'workflow';

  /**
   * 其他业务字段（灵活扩展）
   */
  [key: string]: any;
}

/**
 * Thread 状态（支持可恢复运行）
 *
 * **核心设计**：
 * - 存储 activeStreamId、pending toolCalls 等运行时状态
 * - 支持长任务进度跟踪
 * - 支持断点续传和恢复
 */
export interface ThreadState {
  /**
   * 活跃的流式 ID（用于恢复中断的流）
   */
  activeStreamId?: string;

  /**
   * 待处理的工具调用（HITL - Human in the Loop）
   */
  pendingToolCalls?: Array<{
    toolCallId: string;
    toolName: string;
    status: 'pending' | 'approved' | 'rejected';
    requestedAt?: string; // ISO 8601
  }>;

  /**
   * 长任务进度
   */
  taskProgress?: {
    current: number;
    total: number;
    status: string;
    message?: string;
  };

  /**
   * 运行状态标记
   */
  isRunning?: boolean;

  /**
   * 最后错误信息
   */
  lastError?: string;

  /**
   * 其他状态字段
   */
  [key: string]: any;
}

/**
 * Thread 实体（对话线程/会话）
 *
 * **设计理念**：
 * - Thread 是对话的容器，包含多条 Message
 * - 支持临时对话（agentId 可为空）
 * - state 字段支持可恢复运行
 * - metadata 暴露给前端 assistant-ui
 * - lastMessageAt 用于排序和清理
 */
@Entity({ name: "agent_threads" })
@Index(['teamId', 'userId', 'updatedTimestamp']) // 用户线程列表优化
@Index(['agentId', 'updatedTimestamp']) // Agent 使用统计
@Index(['teamId', 'lastMessageAt']) // 最近活跃线程
export class ThreadEntity extends BaseEntity {
  /**
   * 关联的 Agent ID（nullable 支持临时对话）
   */
  @Column({ type: 'varchar', length: 128, nullable: true, name: 'agent_id' })
  agentId: string;

  /**
   * 所属团队 ID
   */
  @Column({ type: 'varchar', length: 128, name: 'team_id' })
  teamId: string;

  /**
   * 创建者/所有者 ID
   */
  @Column({ type: 'varchar', length: 128, name: 'user_id' })
  userId: string;

  /**
   * 对话标题（自动生成或用户设置）
   */
  @Column({ type: 'varchar', length: 500, nullable: true })
  title: string;

  /**
   * 元数据（JSONB）
   * 暴露给 assistant-ui 的 thread extras
   */
  @Column({ type: 'jsonb', nullable: true })
  metadata: ThreadMetadata;

  /**
   * 可恢复运行状态（JSONB）
   * 存储 activeStreamId、pending toolCalls、长任务进度
   */
  @Column({ type: 'jsonb', nullable: true })
  state: ThreadState;

  /**
   * 最后一条消息时间
   * 用于列表排序和自动清理
   */
  @Column({ type: 'timestamp', nullable: true, name: 'last_message_at' })
  lastMessageAt: Date;

  // ========== 关联关系 ==========

  @ManyToOne(() => AgentEntity, { nullable: true })
  @JoinColumn({ name: 'agent_id' })
  agent: AgentEntity;

  @ManyToOne(() => TeamEntity)
  @JoinColumn({ name: 'team_id' })
  team: TeamEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;
}
