import { Injectable, Logger, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { TeamQuotaRepository } from '../repositories/team-quota.repository';
import { ToolCallRepository } from '../repositories/tool-call.repository';
import { QuotaConfig, QuotaExceededError, UsageStats } from '../types/tool.types';

/**
 * Agent Quota Service
 *
 * **职责**：
 * - 团队级别的工具调用配额管理
 * - 并发槽管理（基于 CacheManager）
 * - 使用量统计和追踪
 */
@Injectable()
export class AgentQuotaService {
  private readonly logger = new Logger(AgentQuotaService.name);
  private readonly DEFAULT_QUOTA = 1000;
  private readonly DEFAULT_MAX_CONCURRENT = 10;
  private readonly CACHE_TTL = 86400; // 24 小时

  constructor(
    private readonly teamQuotaRepository: TeamQuotaRepository,
    private readonly toolCallRepository: ToolCallRepository,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {
    // 启动时定期检查并重置过期配额
    this.startQuotaResetSchedule();
  }

  /**
   * 获取团队的配额配置
   */
  async getQuotaConfig(teamId: string): Promise<QuotaConfig> {
    const quota = await this.teamQuotaRepository.findOrCreate(teamId);

    return {
      dailyQuota: quota.dailyToolCallQuota,
      maxConcurrent: quota.maxConcurrentToolCalls,
      enabled: quota.enabled,
      resetAt: quota.quotaResetAt,
    };
  }

  /**
   * 获取团队当前使用量
   */
  async getCurrentUsage(teamId: string): Promise<number> {
    // 优先从缓存读取
    const cacheKey = this.getUsageCacheKey(teamId);
    const cached = await this.cacheManager.get<number>(cacheKey);

    if (cached !== null && cached !== undefined) {
      return cached;
    }

    // 从数据库读取
    const quota = await this.teamQuotaRepository.findByTeamId(teamId);
    if (quota) {
      // 更新缓存
      await this.cacheManager.set(cacheKey, quota.currentUsage, this.CACHE_TTL);
      return quota.currentUsage;
    }

    return 0;
  }

  /**
   * 检查并消费配额
   */
  async checkAndConsumeQuota(teamId: string): Promise<void> {
    const config = await this.getQuotaConfig(teamId);

    if (!config.enabled) {
      return; // 配额未启用，直接通过
    }

    const usage = await this.getCurrentUsage(teamId);

    if (usage >= config.dailyQuota) {
      throw new QuotaExceededError(
        `Daily tool call quota exceeded: ${usage}/${config.dailyQuota}`,
      );
    }

    // 增加使用量
    await this.incrementUsage(teamId);
  }

  /**
   * 增加使用量
   */
  async incrementUsage(teamId: string, amount: number = 1): Promise<void> {
    const cacheKey = this.getUsageCacheKey(teamId);

    // 更新缓存
    const current = (await this.cacheManager.get<number>(cacheKey)) || 0;
    await this.cacheManager.set(cacheKey, current + amount, this.CACHE_TTL);

    // 异步更新数据库（不阻塞）
    this.teamQuotaRepository.incrementUsage(teamId, amount).catch((err) => {
      this.logger.error(`Failed to increment usage for team ${teamId}:`, err);
    });
  }

  /**
   * 获取并发槽（用于限流）
   */
  async acquireConcurrencySlot(teamId: string): Promise<boolean> {
    const config = await this.getQuotaConfig(teamId);
    const key = this.getConcurrencyCacheKey(teamId);

    const current = (await this.cacheManager.get<number>(key)) || 0;

    if (current >= config.maxConcurrent) {
      this.logger.warn(
        `Team ${teamId} exceeded max concurrent tool calls: ${current}/${config.maxConcurrent}`,
      );
      return false;
    }

    // 增加并发计数
    await this.cacheManager.set(key, current + 1, this.CACHE_TTL);
    return true;
  }

  /**
   * 释放并发槽
   */
  async releaseConcurrencySlot(teamId: string): Promise<void> {
    const key = this.getConcurrencyCacheKey(teamId);
    const current = (await this.cacheManager.get<number>(key)) || 0;

    if (current > 0) {
      await this.cacheManager.set(key, current - 1, this.CACHE_TTL);
    }
  }

  /**
   * 获取当前并发数
   */
  async getCurrentConcurrency(teamId: string): Promise<number> {
    const key = this.getConcurrencyCacheKey(teamId);
    return (await this.cacheManager.get<number>(key)) || 0;
  }

  /**
   * 获取使用量统计
   */
  async getUsageStats(
    teamId: string,
    period: 'day' | 'week' | 'month' = 'day',
  ): Promise<UsageStats> {
    const { startDate, endDate } = this.getPeriodRange(period);

    const stats = await this.toolCallRepository.getUsageStats(teamId, startDate, endDate);
    const config = await this.getQuotaConfig(teamId);
    const current = await this.getCurrentUsage(teamId);

    return {
      totalCalls: stats.totalCalls,
      successCount: stats.successCount,
      failureCount: stats.failureCount,
      averageDuration: stats.averageDuration,
      quotaUsage: {
        current,
        limit: config.dailyQuota,
        percentage: (current / config.dailyQuota) * 100,
      },
      byTool: stats.byTool,
    };
  }

  /**
   * 重置团队配额
   */
  async resetQuota(teamId: string): Promise<void> {
    await this.teamQuotaRepository.resetUsage(teamId);

    // 清除缓存
    const usageKey = this.getUsageCacheKey(teamId);
    const concurrencyKey = this.getConcurrencyCacheKey(teamId);
    await this.cacheManager.del(usageKey);
    await this.cacheManager.del(concurrencyKey);

    this.logger.log(`Quota reset for team ${teamId}`);
  }

  /**
   * 更新团队配额配置
   */
  async updateQuotaConfig(teamId: string, config: Partial<QuotaConfig>): Promise<void> {
    await this.teamQuotaRepository.update(teamId, {
      dailyToolCallQuota: config.dailyQuota,
      maxConcurrentToolCalls: config.maxConcurrent,
      enabled: config.enabled,
    });

    this.logger.log(`Quota config updated for team ${teamId}`, config);
  }

  /**
   * 启动配额重置定时任务（每小时检查一次）
   */
  private startQuotaResetSchedule(): void {
    setInterval(
      async () => {
        try {
          await this.teamQuotaRepository.resetExpiredQuotas();
          this.logger.debug('Checked and reset expired quotas');
        } catch (error) {
          this.logger.error('Failed to reset expired quotas:', error);
        }
      },
      60 * 60 * 1000,
    ); // 每小时执行一次
  }

  /**
   * 获取使用量缓存键
   */
  private getUsageCacheKey(teamId: string): string {
    return `tool_usage:${teamId}`;
  }

  /**
   * 获取并发缓存键
   */
  private getConcurrencyCacheKey(teamId: string): string {
    return `tool_concurrent:${teamId}`;
  }

  /**
   * 获取时间段范围
   */
  private getPeriodRange(period: 'day' | 'week' | 'month'): { startDate: Date; endDate: Date } {
    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
      case 'day':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        startDate.setHours(0, 0, 0, 0);
        break;
    }

    return { startDate, endDate };
  }
}
