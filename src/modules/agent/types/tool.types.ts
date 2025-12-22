/**
 * Agent Tool Types
 *
 * 工具调用相关的类型定义
 */

/**
 * 工具来源类型
 */
export enum ToolSourceType {
  /**
   * 外部工具（来自 ToolEntity，现有工具系统）
   */
  EXTERNAL = 'external',

  /**
   * 内置工具（Agent 专用工具）
   */
  BUILTIN = 'builtin',
}

/**
 * 解析后的工具定义
 */
export interface ResolvedTool {
  /**
   * 工具名称
   */
  name: string;

  /**
   * 工具描述
   */
  description: string;

  /**
   * 工具参数（JSON Schema）
   */
  parameters: any; // JSON Schema

  /**
   * 工具来源类型
   */
  sourceType: ToolSourceType;

  /**
   * 工具元数据
   */
  metadata?: {
    /**
     * 是否需要审批
     */
    needsApproval?: boolean;

    /**
     * 超时时间（毫秒）
     */
    timeout?: number;

    /**
     * 工具分类
     */
    category?: string;

    /**
     * 工具版本
     */
    version?: string;

    /**
     * 其他扩展信息
     */
    [key: string]: any;
  };
}

/**
 * 工具执行结果
 */
export interface ToolExecutionResult {
  /**
   * 是否成功
   */
  success: boolean;

  /**
   * 工具输出结果
   */
  result?: any;

  /**
   * 错误信息（如果失败）
   */
  error?: {
    message: string;
    code?: string;
    details?: any;
  };

  /**
   * 执行耗时（毫秒）
   */
  duration?: number;

  /**
   * 是否需要审批
   */
  needsApproval?: boolean;

  /**
   * 审批状态
   */
  approvalStatus?: 'not_required' | 'pending' | 'approved' | 'rejected';
}

/**
 * 工具调用参数
 */
export interface ToolCallParams {
  /**
   * 线程 ID
   */
  threadId: string;

  /**
   * 消息 ID
   */
  messageId: string;

  /**
   * 团队 ID
   */
  teamId: string;

  /**
   * 用户 ID
   */
  userId: string;

  /**
   * 工具调用 ID
   */
  toolCallId: string;

  /**
   * 工具名称
   */
  toolName: string;

  /**
   * 工具参数
   */
  args: any;
}

/**
 * 使用量统计
 */
export interface UsageStats {
  /**
   * 总调用次数
   */
  totalCalls: number;

  /**
   * 成功次数
   */
  successCount: number;

  /**
   * 失败次数
   */
  failureCount: number;

  /**
   * 平均执行时间（毫秒）
   */
  averageDuration: number;

  /**
   * 配额使用情况
   */
  quotaUsage: {
    /**
     * 当前使用量
     */
    current: number;

    /**
     * 配额限制
     */
    limit: number;

    /**
     * 使用百分比
     */
    percentage: number;
  };

  /**
   * 按工具分组的统计
   */
  byTool?: Record<string, {
    calls: number;
    avgDuration: number;
  }>;
}

/**
 * 配额配置
 */
export interface QuotaConfig {
  /**
   * 每日配额
   */
  dailyQuota: number;

  /**
   * 最大并发数
   */
  maxConcurrent: number;

  /**
   * 是否启用
   */
  enabled: boolean;

  /**
   * 配额重置时间
   */
  resetAt?: Date;
}

/**
 * 配额超限错误
 */
export class QuotaExceededError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'QuotaExceededError';
  }
}

/**
 * 工具未找到错误
 */
export class ToolNotFoundError extends Error {
  constructor(toolName: string) {
    super(`Tool not found: ${toolName}`);
    this.name = 'ToolNotFoundError';
  }
}

/**
 * 工具执行超时错误
 */
export class ToolExecutionTimeoutError extends Error {
  constructor(toolName: string, timeout: number) {
    super(`Tool execution timed out: ${toolName} (timeout: ${timeout}ms)`);
    this.name = 'ToolExecutionTimeoutError';
  }
}
