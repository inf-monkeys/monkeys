import { Injectable, Logger } from '@nestjs/common';
import {
  CreativeStateAnalysisRequest,
  CreativeStateAnalysisService,
} from './creative-state-analysis.service';
import { MessageService } from './message.service';
import { ThreadService } from './thread.service';

/**
 * 灵感推送请求
 */
export interface InspirationPushRequest {
  teamId: string;
  userId: string;
  threadId: string;
  /** 画布数据 */
  canvasData: any;
  /** 选中的图形ID（可选） */
  selectedShapeIds?: string[];
  /** 视口信息（可选） */
  viewport?: { x: number; y: number; zoom: number };
}

/**
 * 灵感推送响应
 */
export interface InspirationPushResponse {
  /** 是否成功推送 */
  success: boolean;
  /** 推送的消息ID */
  messageId?: string;
  /** 分析的创作状态 */
  state?: string;
  /** 建议数量 */
  suggestionCount?: number;
  /** 错误信息（如果失败） */
  error?: string;
}

/**
 * Inspiration Push Service
 *
 * **职责**：
 * - 在用户60秒无操作后被调用
 * - 分析当前画布的创作状态
 * - 自动向thread推送AI灵感消息
 * - 集成创作状态分析和消息推送
 */
@Injectable()
export class InspirationPushService {
  private readonly logger = new Logger(InspirationPushService.name);

  constructor(
    private readonly creativeStateAnalysis: CreativeStateAnalysisService,
    private readonly messageService: MessageService,
    private readonly threadService: ThreadService,
  ) {}

  /**
   * 执行灵感推送流程
   * 1. 分析创作状态
   * 2. 生成灵感建议
   * 3. 作为AI消息推送到thread
   */
  async pushInspiration(
    request: InspirationPushRequest,
  ): Promise<InspirationPushResponse> {
    const { threadId, teamId, userId } = request;

    this.logger.log(
      `Pushing inspiration for thread ${threadId}, user ${userId}, team ${teamId}`,
    );

    try {
      // 1. 检查thread状态
      const thread = await this.threadService.get(threadId, teamId);
      if (!thread) {
        throw new Error(`Thread ${threadId} not found`);
      }

      // 如果thread正在运行中（用户正在与AI对话），不推送
      if (thread.state?.isRunning) {
        this.logger.debug(
          `Thread ${threadId} is currently running, skipping inspiration push`,
        );
        return {
          success: false,
          error: 'Thread is currently active',
        };
      }

      // 2. 分析创作状态
      const analysisRequest: CreativeStateAnalysisRequest = {
        teamId,
        userId,
        threadId,
        canvasData: request.canvasData,
        selectedShapeIds: request.selectedShapeIds,
        viewport: request.viewport,
      };

      const analysisResult =
        await this.creativeStateAnalysis.analyzeCreativeState(analysisRequest);

      this.logger.debug(
        `Creative state analyzed: ${analysisResult.state} with ${analysisResult.suggestions.length} suggestions`,
      );

      // 3. 格式化为消息文本
      const messageText =
        this.creativeStateAnalysis.formatAsMessage(analysisResult);

      // 4. 作为assistant消息保存到thread
      const message = await this.messageService.saveAssistantMessage({
        threadId,
        teamId,
        parts: [
          {
            type: 'text',
            text: messageText,
          },
        ],
        metadata: {
          type: 'inspiration_push',
          creativeState: analysisResult.state,
          confidence: analysisResult.confidence,
          suggestionCount: analysisResult.suggestions.length,
          triggeredBy: 'idle_timer',
          triggeredAt: new Date().toISOString(),
        },
      });

      this.logger.log(
        `Inspiration pushed successfully to thread ${threadId}, message ${message.id}`,
      );

      return {
        success: true,
        messageId: message.id,
        state: analysisResult.state,
        suggestionCount: analysisResult.suggestions.length,
      };
    } catch (error) {
      this.logger.error(
        `Failed to push inspiration for thread ${threadId}`,
        error.stack,
      );

      return {
        success: false,
        error: error.message || 'Unknown error',
      };
    }
  }

  /**
   * 批量检查多个thread并推送灵感
   * （可用于定时任务，但根据当前设计主要由前端触发单次推送）
   */
  async batchPushInspiration(
    requests: InspirationPushRequest[],
  ): Promise<InspirationPushResponse[]> {
    this.logger.log(`Batch pushing inspiration for ${requests.length} threads`);

    const results: InspirationPushResponse[] = [];

    for (const request of requests) {
      try {
        const result = await this.pushInspiration(request);
        results.push(result);
      } catch (error) {
        this.logger.error(
          `Failed to push inspiration for thread ${request.threadId}`,
          error.stack,
        );
        results.push({
          success: false,
          error: error.message || 'Unknown error',
        });
      }
    }

    this.logger.log(
      `Batch push completed: ${results.filter((r) => r.success).length}/${results.length} succeeded`,
    );

    return results;
  }

  /**
   * 检查是否应该推送灵感
   * 基于thread状态、最后活动时间等条件
   */
  async shouldPushInspiration(threadId: string, teamId: string): Promise<boolean> {
    this.logger.debug(`[shouldPushInspiration] Checking for thread ${threadId}`);

    try {
      const thread = await this.threadService.get(threadId, teamId);

      if (!thread) {
        this.logger.warn(`[shouldPushInspiration] Thread not found: ${threadId}`);
        return false;
      }

      this.logger.debug(`[shouldPushInspiration] Thread found, isRunning: ${thread.state?.isRunning}`);

      // 如果thread正在运行，不推送
      if (thread.state?.isRunning) {
        this.logger.debug(
          `[shouldPushInspiration] Thread is running, skipping push`,
        );
        return false;
      }

      // 检查最后一条消息的时间（可选，如果需要防止频繁推送）
      this.logger.debug(`[shouldPushInspiration] Fetching messages for thread ${threadId}`);
      const messages = await this.messageService.getThreadMessages(threadId, teamId);
      this.logger.debug(
        `[shouldPushInspiration] Thread has ${messages?.length || 0} messages`,
      );

      if (messages && messages.length > 0) {
        const lastMessage = messages[messages.length - 1];
        const timeSinceLastMessage = Date.now() - lastMessage.createdTimestamp;

        this.logger.debug(
          `[shouldPushInspiration] Last message type: ${lastMessage.metadata?.type}, time since last: ${Math.round(timeSinceLastMessage / 1000)}s`,
        );

        // 如果最后一条消息是灵感推送且在30秒内，不再推送（冷却期）
        const cooldownPeriod = 30 * 1000; // 30秒冷却期
        if (
          lastMessage.metadata?.type === 'inspiration_push' &&
          timeSinceLastMessage < cooldownPeriod
        ) {
          this.logger.debug(
            `[shouldPushInspiration] Last inspiration was pushed ${Math.round(timeSinceLastMessage / 1000)}s ago (cooldown: ${cooldownPeriod / 1000}s), skipping`,
          );
          return false;
        }
      }

      this.logger.log(`[shouldPushInspiration] ✅ All checks passed, should push for thread ${threadId}`);
      return true;
    } catch (error) {
      this.logger.error(
        `[shouldPushInspiration] ❌ Failed to check if should push inspiration for thread ${threadId}`,
        error.stack,
      );
      return false;
    }
  }
}
