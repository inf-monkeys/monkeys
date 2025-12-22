import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../base/base';

/**
 * Team Quota Entity
 *
 * **设计理念**：
 * - 管理团队级别的工具调用配额
 * - 支持每日配额和并发限制
 * - 支持工具级别的细粒度限制
 * - 配额每日自动重置
 */
@Entity({ name: 'team_quotas' })
@Index(['teamId'], { unique: true })
export class TeamQuotaEntity extends BaseEntity {
  /**
   * 所属团队 ID
   */
  @Column({ type: 'varchar', length: 128, unique: true, name: 'team_id' })
  teamId: string;

  /**
   * 每日工具调用配额
   * @default 1000
   */
  @Column({ type: 'integer', default: 1000, name: 'daily_tool_call_quota' })
  dailyToolCallQuota: number;

  /**
   * 最大并发工具调用数
   * @default 10
   */
  @Column({ type: 'integer', default: 10, name: 'max_concurrent_tool_calls' })
  maxConcurrentToolCalls: number;

  /**
   * 工具级别的自定义限制
   * 格式: { toolName: { dailyQuota: number, concurrent: number } }
   */
  @Column({ type: 'jsonb', nullable: true, name: 'custom_limits' })
  customLimits: Record<string, any>;

  /**
   * 配额重置时间（UTC时间，每日0点）
   */
  @Column({ type: 'timestamp', nullable: true, name: 'quota_reset_at' })
  quotaResetAt: Date;

  /**
   * 当前已使用的配额（缓存字段，实际计数在 cache 中）
   */
  @Column({ type: 'integer', default: 0, name: 'current_usage' })
  currentUsage: number;

  /**
   * 是否启用配额限制
   * @default true
   */
  @Column({ type: 'boolean', default: true, name: 'enabled' })
  enabled: boolean;
}
