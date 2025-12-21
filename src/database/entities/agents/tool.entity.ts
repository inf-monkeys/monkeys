import { config } from '@/common/config';
import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../base/base';

const appId = config.server.appId;

/**
 * JSON Schema for tool input
 */
export interface ToolInputSchema {
  type: 'object';
  properties: Record<string, any>;
  required?: string[];
  additionalProperties?: boolean;
}

/**
 * 审批策略配置
 */
export interface ApprovalPolicy {
  /**
   * 自动审批
   */
  auto?: boolean;

  /**
   * 审批超时（ms）
   */
  timeout?: number;

  /**
   * 审批人列表
   */
  approvers?: string[];
}

/**
 * Tool 实体（工具定义）
 *
 * **设计理念**：
 * - 工具定义独立于 Agent，Agent 通过 toolNames 引用
 * - 支持团队私有工具和公开工具
 * - 支持 HITL（Human in the Loop）审批机制
 * - inputSchema 使用 JSON Schema 标准
 * - 支持工具版本管理
 */
@Entity({ name: "agent_tools" })
@Index(['teamId', 'name'], { unique: true, where: 'is_deleted = false' }) // 团队内工具名唯一
@Index(['category', 'isPublic']) // 按类别筛选
@Index(['isPublic', 'isDeleted']) // 公开工具列表
export class ToolEntity extends BaseEntity {
  /**
   * 所属团队 ID
   */
  @Column({ type: 'varchar', length: 128, name: 'team_id' })
  teamId: string;

  /**
   * 工具名称（对应 AI SDK 的 toolName）
   * 全链路唯一且稳定，建议带版本
   */
  @Column({ type: 'varchar', length: 255 })
  name: string;

  /**
   * 工具描述
   */
  @Column({ type: 'text' })
  description: string;

  /**
   * JSON Schema（对应 AI SDK 的 parameters）
   */
  @Column({ type: 'jsonb', name: 'input_schema' })
  inputSchema: ToolInputSchema;

  /**
   * 工具类别（用于分组）
   */
  @Column({ type: 'varchar', length: 50, nullable: true })
  category: string;

  /**
   * 是否需要审批（HITL - Human in the Loop）
   */
  @Column({ type: 'boolean', default: false, name: 'needs_approval' })
  needsApproval: boolean;

  /**
   * 审批策略（JSON 配置）
   */
  @Column({ type: 'jsonb', nullable: true, name: 'approval_policy' })
  approvalPolicy: ApprovalPolicy;

  /**
   * 是否公开（所有团队可用）
   */
  @Column({ type: 'boolean', default: false, name: 'is_public' })
  isPublic: boolean;

  /**
   * 工具版本
   */
  @Column({ type: 'varchar', length: 50, nullable: true })
  version: string;

  /**
   * 工具图标 URL
   */
  @Column({ type: 'varchar', nullable: true, name: 'icon_url' })
  iconUrl: string;
}
