import { config } from '@/common/config';
import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../base/base';
import { ThreadEntity } from './thread.entity';

const appId = config.server.appId;

/**
 * UIMessage.parts 结构（assistant-ui 标准）
 *
 * 支持的 part 类型：
 * - text: 文本内容
 * - reasoning: 推理过程（o1/o3 模型）
 * - tool-call: 工具调用
 * - tool-result: 工具结果
 * - file: 文件附件
 * - image: 图片
 * - audio: 音频
 * - data-*: 自定义数据
 * - source-*: 来源引用
 * - step-start: 步骤开始
 */
export type UIMessagePart =
  | {
      type: 'text';
      text: string;
    }
  | {
      type: 'reasoning';
      reasoning: string;
      summary?: string;
    }
  | {
      type: 'tool-call';
      toolCallId: string;
      toolName: string;
      args: any;
      argsText?: string; // 流式传输时的文本形式
      state?: 'input-streaming' | 'input-available' | 'output-available' | 'output-error';
      result?: any;
      isError?: boolean;
    }
  | {
      type: 'tool-result';
      toolCallId: string;
      toolName: string;
      result: any;
      isError?: boolean;
    }
  | {
      type: 'image';
      image: string; // URL 或 base64
      mediaId?: string; // 内部媒体 ID
    }
  | {
      type: 'file';
      file: {
        name: string;
        type: string;
        url: string;
      };
    }
  | {
      type: 'audio';
      audio: string; // URL
    };

/**
 * UIMessage.metadata 结构
 */
export interface UIMessageMetadata {
  /**
   * 使用的模型
   */
  model?: string;

  /**
   * Token 使用情况
   */
  tokens?: {
    prompt: number;
    completion: number;
    total: number;
  };

  /**
   * 完成原因
   */
  finishReason?: 'stop' | 'length' | 'tool-calls' | 'content-filter';

  /**
   * 推理步骤（o1/o3 模型）
   */
  reasoningSteps?: number;

  /**
   * 耗时（ms）
   */
  duration?: number;

  /**
   * 其他自定义字段
   */
  [key: string]: any;
}

/**
 * Message 实体（消息记录）
 *
 * **设计理念**：
 * - 以 UIMessage 作为主存格式
 * - parts 字段存储完整的 UIMessage.parts 结构
 * - 支持分支和重试（parent_id/branch_id）
 * - 工具调用同时存储在 parts 和 tool_calls 表中
 * - metadata 包含模型、token、完成原因等元信息
 */
@Entity({ name: "agent_messages" })
@Index(['threadId', 'createdTimestamp']) // 线程消息列表（时间顺序）
@Index(['threadId', 'parentId']) // 分支查询
@Index(['teamId', 'createdTimestamp']) // 团队消息统计
export class MessageEntity extends BaseEntity {
  /**
   * 所属线程 ID
   */
  @Column({ type: 'varchar', length: 128, name: 'thread_id' })
  threadId: string;

  /**
   * 所属团队 ID
   */
  @Column({ type: 'varchar', length: 128, name: 'team_id' })
  teamId: string;

  /**
   * 消息角色
   */
  @Column({ type: 'varchar', length: 20 })
  role: 'system' | 'user' | 'assistant';

  /**
   * UIMessage.parts（核心存储格式）
   * 数组包含文本、推理、工具调用、图片等多种 part 类型
   */
  @Column({ type: 'jsonb' })
  parts: UIMessagePart[];

  /**
   * UIMessage.metadata
   * 包含模型、token、完成原因等元信息
   */
  @Column({ type: 'jsonb', nullable: true })
  metadata: UIMessageMetadata;

  /**
   * 父消息 ID（用于分支和重试）
   */
  @Column({ type: 'varchar', length: 128, nullable: true, name: 'parent_id' })
  parentId: string;

  /**
   * 分支 ID（用于多分支对话）
   */
  @Column({ type: 'varchar', length: 128, nullable: true, name: 'branch_id' })
  branchId: string;

  // ========== 关联关系 ==========

  @ManyToOne(() => ThreadEntity)
  @JoinColumn({ name: 'thread_id' })
  thread: ThreadEntity;

  // 自引用：父消息（用于分支）
  @ManyToOne(() => MessageEntity, { nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent: MessageEntity;
}
