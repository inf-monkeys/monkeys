import { CacheManager } from '@/common/cache';
import { CACHE_TOKEN } from '@/common/common.module';
import { config } from '@/common/config';
import { generateDbId } from '@/common/utils';
import { RedisLockManager } from '@/common/utils/lock';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { OpenSkillService } from './openskill.service';

const appId = config.server.appId;

export interface BattleTask {
  id: string;
  teamId: string;
  moduleId: string;
  assetAId: string;
  assetBId: string;
  quality: number;
  createdAt: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
}

export interface MatchmakingResult {
  generated: number;
  skipped: number;
  averageQuality: number;
}

@Injectable()
export class MatchmakingService {
  private readonly logger = new Logger(MatchmakingService.name);
  private readonly lockManager: RedisLockManager;

  // Redis Key命名空间
  private readonly REDIS_KEYS = {
    MATCH_POOL: (teamId: string, moduleId: string) => `${appId}:eval:${teamId}:${moduleId}:pool`,

    BATTLE_QUEUE: (teamId: string, moduleId: string) => `${appId}:eval:${teamId}:${moduleId}:battles`,

    MATCH_LOCK: (teamId: string, assetId: string) => `${appId}:eval:${teamId}:match_lock:${assetId}`,

    BATTLE_PROGRESS: (teamId: string, moduleId: string) => `${appId}:eval:${teamId}:${moduleId}:progress`,
  };

  constructor(
    @Inject(CACHE_TOKEN) private readonly redis: CacheManager,
    private readonly openskillService: OpenSkillService,
  ) {
    this.lockManager = new RedisLockManager(config.redis);
  }

  /**
   * 为指定资产寻找最佳对手
   */
  async findBestOpponent(teamId: string, moduleId: string, assetId: string): Promise<string | null> {
    // 获取匹配锁
    const lockId = await this.lockManager.acquireLock(`match:${teamId}:${assetId}`, 30000);
    if (!lockId) {
      this.logger.debug(`Failed to acquire match lock for asset ${assetId}`);
      return null;
    }

    try {
      const poolKey = this.REDIS_KEYS.MATCH_POOL(teamId, moduleId);

      // 从匹配池获取候选者（按活跃度排序，优先匹配新加入或长时间未对战的资产）
      const candidates = await this.redis.zrange(poolKey, 0, 100);

      if (candidates.length < 2) {
        this.logger.debug(`Not enough candidates in pool for module ${moduleId}`);
        return null;
      }

      let bestOpponent = null;
      let bestQuality = 0;

      // 智能匹配算法：寻找质量在0.4-0.6范围内的最佳对手
      for (const candidateId of candidates) {
        if (candidateId === assetId) continue;

        const ratingA = await this.openskillService.getAssetRating(teamId, moduleId, assetId);
        const ratingB = await this.openskillService.getAssetRating(teamId, moduleId, candidateId);
        if (!ratingA || !ratingB) continue;
        const quality = this.openskillService.calculateMatchQuality(teamId, moduleId, assetId, candidateId, ratingA, ratingB);

        // 理想的匹配质量范围：0.4-0.6 (接近50%胜率)
        if (quality >= 0.4 && quality <= 0.6 && quality > bestQuality) {
          bestQuality = quality;
          bestOpponent = candidateId;
        }
      }

      // 如果没有找到理想质量的对手，选择质量最接近0.5的
      if (!bestOpponent && candidates.length >= 2) {
        let closestTo50 = 1;
        for (const candidateId of candidates) {
          if (candidateId === assetId) continue;

          const ratingA = await this.openskillService.getAssetRating(teamId, moduleId, assetId);
          const ratingB = await this.openskillService.getAssetRating(teamId, moduleId, candidateId);
          if (!ratingA || !ratingB) continue;
          const quality = this.openskillService.calculateMatchQuality(teamId, moduleId, assetId, candidateId, ratingA, ratingB);
          const distanceFrom50 = Math.abs(quality - 0.5);

          if (distanceFrom50 < closestTo50) {
            closestTo50 = distanceFrom50;
            bestOpponent = candidateId;
            bestQuality = quality;
          }
        }
      }

      if (bestOpponent) {
        this.logger.debug(`Found best opponent for ${assetId}: ${bestOpponent} (quality: ${bestQuality.toFixed(3)})`);
      }

      return bestOpponent;
    } finally {
      await this.lockManager.releaseLock(`match:${teamId}:${assetId}`, lockId);
    }
  }

  /**
   * 批量生成高质量对战
   */
  async generateBattles(teamId: string, moduleId: string, count: number = 100): Promise<MatchmakingResult> {
    const poolKey = this.REDIS_KEYS.MATCH_POOL(teamId, moduleId);
    const queueKey = this.REDIS_KEYS.BATTLE_QUEUE(teamId, moduleId);

    // 获取所有候选资产
    const assets = await this.redis.zrange(poolKey, 0, -1);

    if (assets.length < 2) {
      this.logger.warn(`Not enough assets for battle generation in module ${moduleId}`);
      return { generated: 0, skipped: count, averageQuality: 0 };
    }

    let generated = 0;
    let totalQuality = 0;
    const usedPairs = new Set<string>();

    // 尝试生成指定数量的对战
    for (let attempt = 0; attempt < count * 2 && generated < count; attempt++) {
      // 随机选择一个资产作为起点
      const randomIndex = Math.floor(Math.random() * assets.length);
      const assetId = assets[randomIndex];

      const opponent = await this.findBestOpponent(teamId, moduleId, assetId);

      if (opponent) {
        // 创建配对标识，避免重复配对
        const pairKey = [assetId, opponent].sort().join('|');

        if (!usedPairs.has(pairKey)) {
          const ratingA2 = await this.openskillService.getAssetRating(teamId, moduleId, assetId);
          const ratingB2 = await this.openskillService.getAssetRating(teamId, moduleId, opponent);
          if (!ratingA2 || !ratingB2) continue;
          const quality = this.openskillService.calculateMatchQuality(teamId, moduleId, assetId, opponent, ratingA2, ratingB2);

          const battleTask: BattleTask = {
            id: generateDbId(),
            teamId,
            moduleId,
            assetAId: assetId,
            assetBId: opponent,
            quality,
            createdAt: Date.now(),
            status: 'PENDING',
          };

          // 添加到对战队列
          await this.redis.lpush(queueKey, JSON.stringify(battleTask));

          usedPairs.add(pairKey);
          generated++;
          totalQuality += quality;

          // 更新匹配池中的时间戳，确保刚匹配的资产不会立即再次匹配
          const now = Date.now();
          if (this.redis.pipeline) {
            const pipeline = this.redis.pipeline();
            pipeline.zadd(poolKey, now, assetId);
            pipeline.zadd(poolKey, now, opponent);
            await pipeline.exec();
          } else {
            // Fallback for in-memory cache
            await this.redis.zadd(poolKey, now, assetId);
            await this.redis.zadd(poolKey, now, opponent);
          }
        }
      }
    }

    // 更新进度信息
    await this.updateBattleProgress(teamId, moduleId, generated, 0);

    const averageQuality = generated > 0 ? totalQuality / generated : 0;

    this.logger.log(`Generated ${generated} battles for module ${moduleId}, average quality: ${averageQuality.toFixed(3)}`);

    return {
      generated,
      skipped: count - generated,
      averageQuality,
    };
  }

  /**
   * 从队列获取下一个对战任务
   */
  async getNextBattle(teamId: string, moduleId: string): Promise<BattleTask | null> {
    const queueKey = this.REDIS_KEYS.BATTLE_QUEUE(teamId, moduleId);

    const taskData = await this.redis.brpop(queueKey, 5);
    if (!taskData) return null;

    try {
      const task = JSON.parse(taskData[1]) as BattleTask;
      task.status = 'PROCESSING';
      return task;
    } catch (error) {
      this.logger.error(`Failed to parse battle task: ${error.message}`);
      return null;
    }
  }

  /**
   * 获取队列状态
   */
  async getQueueStatus(
    teamId: string,
    moduleId: string,
  ): Promise<{
    pending: number;
    processing: number;
    totalGenerated: number;
    completed: number;
  }> {
    const queueKey = this.REDIS_KEYS.BATTLE_QUEUE(teamId, moduleId);
    const progressKey = this.REDIS_KEYS.BATTLE_PROGRESS(teamId, moduleId);

    const pending = await this.redis.llen(queueKey);
    const progressData = await this.redis.hgetall(progressKey);

    return {
      pending,
      processing: parseInt(progressData.processing || '0'),
      totalGenerated: parseInt(progressData.totalGenerated || '0'),
      completed: parseInt(progressData.completed || '0'),
    };
  }

  /**
   * 更新对战进度
   */
  async updateBattleProgress(teamId: string, moduleId: string, totalGenerated?: number, completed?: number, processing?: number): Promise<void> {
    const progressKey = this.REDIS_KEYS.BATTLE_PROGRESS(teamId, moduleId);

    const updates: Record<string, string> = {};
    if (totalGenerated !== undefined) updates.totalGenerated = totalGenerated.toString();
    if (completed !== undefined) updates.completed = completed.toString();
    if (processing !== undefined) updates.processing = processing.toString();

    if (Object.keys(updates).length > 0) {
      await this.redis.hmset(progressKey, updates);
      await this.redis.expire(progressKey, 24 * 3600); // 24小时过期
    }
  }

  /**
   * 增加完成计数
   */
  async incrementCompleted(teamId: string, moduleId: string): Promise<void> {
    const progressKey = this.REDIS_KEYS.BATTLE_PROGRESS(teamId, moduleId);
    await this.redis.hincrby(progressKey, 'completed', 1);
  }

  /**
   * 清理评测模块的匹配数据
   */
  async cleanupMatchmaking(teamId: string, moduleId: string): Promise<void> {
    const keys = [this.REDIS_KEYS.MATCH_POOL(teamId, moduleId), this.REDIS_KEYS.BATTLE_QUEUE(teamId, moduleId), this.REDIS_KEYS.BATTLE_PROGRESS(teamId, moduleId)];

    await this.redis.del(...keys);
    this.logger.log(`Cleaned up matchmaking data for module ${moduleId}`);
  }

  /**
   * 获取匹配质量统计
   */
  async getMatchQualityStats(
    teamId: string,
    moduleId: string,
  ): Promise<{
    totalAssets: number;
    averageQuality: number;
    qualityDistribution: { range: string; count: number }[];
  }> {
    const poolKey = this.REDIS_KEYS.MATCH_POOL(teamId, moduleId);
    const assets = await this.redis.zrange(poolKey, 0, -1);

    if (assets.length < 2) {
      return {
        totalAssets: assets.length,
        averageQuality: 0,
        qualityDistribution: [],
      };
    }

    let totalQuality = 0;
    let qualityCount = 0;
    const qualityBuckets = {
      poor: 0, // 0.0-0.3
      fair: 0, // 0.3-0.4
      good: 0, // 0.4-0.6
      excellent: 0, // 0.6-1.0
    };

    // 采样计算匹配质量（避免计算所有组合）
    const sampleSize = Math.min(50, assets.length);
    for (let i = 0; i < sampleSize; i++) {
      for (let j = i + 1; j < sampleSize; j++) {
        const ratingI = await this.openskillService.getAssetRating(teamId, moduleId, assets[i]);
        const ratingJ = await this.openskillService.getAssetRating(teamId, moduleId, assets[j]);
        if (!ratingI || !ratingJ) continue;
        const quality = this.openskillService.calculateMatchQuality(teamId, moduleId, assets[i], assets[j], ratingI, ratingJ);

        totalQuality += quality;
        qualityCount++;

        if (quality < 0.3) qualityBuckets.poor++;
        else if (quality < 0.4) qualityBuckets.fair++;
        else if (quality < 0.6) qualityBuckets.good++;
        else qualityBuckets.excellent++;
      }
    }

    const averageQuality = qualityCount > 0 ? totalQuality / qualityCount : 0;

    return {
      totalAssets: assets.length,
      averageQuality,
      qualityDistribution: [
        { range: '0.0-0.3 (Poor)', count: qualityBuckets.poor },
        { range: '0.3-0.4 (Fair)', count: qualityBuckets.fair },
        { range: '0.4-0.6 (Good)', count: qualityBuckets.good },
        { range: '0.6-1.0 (Excellent)', count: qualityBuckets.excellent },
      ],
    };
  }
}
