import { config } from '@/common/config';
import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../base/base';
import { TeamEntity } from '../identity/team';
import { UserEntity } from '../identity/user';

const appId = config.server.appId;

/**
 * Agent 配置结构
 * 对应 Vercel AI SDK V6 的 ToolLoopAgent 配置
 *
 * Agent 作为"版本化配置"，线程只引用 agentId，避免配置漂移
 */
export interface AgentConfig {
  // ========== 模型配置 ==========
  /**
   * 模型标识符，格式: "provider:model-name"
   * 例如: "openai:gpt-4", "anthropic:claude-3-5-sonnet-20241022"
   */
  model: string;

  /**
   * 系统指令（对应 AI SDK 的 instructions/system）
   * 模板化 + 版本号，支持 A/B 测试和回放
   */
  instructions: string;

  // ========== 模型参数 ==========
  /**
   * 采样温度 (0-2)
   * - 0: 最确定性
   * - 1: 平衡
   * - 2: 最随机
   * @default 0.7
   */
  temperature?: number;

  /**
   * 最大生成 token 数
   * @default 4096
   */
  maxTokens?: number;

  /**
   * Top-p 采样
   * @default 1.0
   */
  topP?: number;

  /**
   * 频率惩罚 (-2.0 to 2.0)
   */
  frequencyPenalty?: number;

  /**
   * 存在惩罚 (-2.0 to 2.0)
   */
  presencePenalty?: number;

  // ========== 工具配置（对应 AI SDK 的 ToolSet）==========
  tools?: {
    /**
     * 是否启用工具调用
     */
    enabled: boolean;

    /**
     * 允许的工具名称列表
     * toolName 全链路唯一且稳定，建议带版本
     */
    toolNames: string[];

    /**
     * 工具版本（用于 A/B 测试）
     */
    toolsVersion?: string;
  };

  // ========== 输出控制 ==========
  stopWhen?: {
    /**
     * 最大推理步数
     * @default 20
     */
    maxSteps?: number;

    /**
     * 超时时间（毫秒）
     * @default 300000 (5分钟)
     */
    timeout?: number;
  };

  // ========== 元数据 ==========
  /**
   * 配置版本号（用于回放、A/B 测试、审计）
   */
  version?: string;

  /**
   * 推理增强配置（o1/o3 模型）
   */
  reasoningEffort?: {
    enabled: boolean;
    level: 'low' | 'medium' | 'high';
  };
}

/**
 * Agent 实体
 *
 * **设计理念**：
 * - Agent = 版本化配置
 * - Thread 只引用 agentId，避免配置漂移
 * - config 使用 JSONB 存储，支持灵活查询
 * - 支持多租户（team_id）
 */
@Entity({ name: "agent_agents" })
@Index(['teamId', 'name'], { unique: true, where: 'is_deleted = false' }) // 团队内名称唯一
@Index(['teamId', 'isDeleted', 'updatedTimestamp']) // 列表查询优化
export class AgentEntity extends BaseEntity {
  /**
   * Agent 名称（团队内唯一）
   */
  @Column({ type: 'varchar', length: 255 })
  name: string;

  /**
   * Agent 描述
   */
  @Column({ type: 'text', nullable: true })
  description: string;

  /**
   * 所属团队 ID
   */
  @Column({ type: 'varchar', length: 128, name: 'team_id' })
  teamId: string;

  /**
   * 创建者 ID
   */
  @Column({ type: 'varchar', length: 128, name: 'created_by' })
  createdBy: string;

  /**
   * Agent 图标 URL
   */
  @Column({ type: 'varchar', nullable: true, name: 'icon_url' })
  iconUrl: string;

  /**
   * JSONB 存储完整配置
   * 支持索引和查询（如按模型筛选）
   */
  @Column({ type: 'jsonb' })
  config: AgentConfig;

  // ========== 关联关系 ==========

  @ManyToOne(() => TeamEntity)
  @JoinColumn({ name: 'team_id' })
  team: TeamEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'created_by' })
  creator: UserEntity;
}
