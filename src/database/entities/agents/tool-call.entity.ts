import { config } from '@/common/config';
import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../base/base';
import { ThreadEntity } from './thread.entity';
import { MessageEntity } from './message.entity';

const appId = config.server.appId;

/**
 * ToolCall 实体（工具调用实例）
 *
 * **设计理念**：
 * - 独立存储工具调用记录，便于统计和审计
 * - toolCallId 作为幂等键，全链路透传
 * - 支持 HITL 审批流程
 * - 记录执行状态、输入输出、耗时等完整信息
 * - 同时在 message.parts 中存储，双重记录确保数据完整性
 */
@Entity({ name: "agent_tool_calls" })
@Index(['threadId', 'createdTimestamp']) // 线程工具调用历史
@Index(['toolCallId'], { unique: true }) // 幂等键
@Index(['toolName', 'status']) // 工具执行统计
@Index(['approvalStatus', 'createdTimestamp']) // 待审批查询
@Index(['isError', 'createdTimestamp']) // 错误监控
export class ToolCallEntity extends BaseEntity {
  /**
   * 工具调用 ID（幂等键，全链路透传）
   */
  @Column({ type: 'varchar', length: 128, unique: true, name: 'tool_call_id' })
  toolCallId: string;

  /**
   * 所属线程 ID
   */
  @Column({ type: 'varchar', length: 128, name: 'thread_id' })
  threadId: string;

  /**
   * 所属消息 ID
   */
  @Column({ type: 'varchar', length: 128, name: 'message_id' })
  messageId: string;

  /**
   * 所属团队 ID
   */
  @Column({ type: 'varchar', length: 128, name: 'team_id' })
  teamId: string;

  /**
   * 工具名称
   */
  @Column({ type: 'varchar', length: 255, name: 'tool_name' })
  toolName: string;

  /**
   * 工具输入（JSON）
   */
  @Column({ type: 'jsonb' })
  input: any;

  /**
   * 工具输出（JSON）
   */
  @Column({ type: 'jsonb', nullable: true })
  output: any;

  /**
   * 执行状态
   */
  @Column({
    type: 'enum',
    enum: ['pending', 'running', 'completed', 'error', 'timeout'],
    default: 'pending',
  })
  status: 'pending' | 'running' | 'completed' | 'error' | 'timeout';

  /**
   * 是否错误
   */
  @Column({ type: 'boolean', default: false, name: 'is_error' })
  isError: boolean;

  /**
   * 错误信息
   */
  @Column({ type: 'text', nullable: true, name: 'error_text' })
  errorText: string;

  /**
   * 审批状态（HITL - Human in the Loop）
   */
  @Column({
    type: 'enum',
    enum: ['not_required', 'pending', 'approved', 'rejected'],
    default: 'not_required',
    name: 'approval_status',
  })
  approvalStatus: 'not_required' | 'pending' | 'approved' | 'rejected';

  /**
   * 审批人 ID
   */
  @Column({ type: 'varchar', length: 128, nullable: true, name: 'approved_by' })
  approvedBy: string;

  /**
   * 审批时间
   */
  @Column({ type: 'timestamp', nullable: true, name: 'approved_at' })
  approvedAt: Date;

  /**
   * 执行耗时（ms）
   */
  @Column({ type: 'integer', nullable: true })
  duration: number;

  // ========== 关联关系 ==========

  @ManyToOne(() => ThreadEntity)
  @JoinColumn({ name: 'thread_id' })
  thread: ThreadEntity;

  @ManyToOne(() => MessageEntity)
  @JoinColumn({ name: 'message_id' })
  message: MessageEntity;
}
