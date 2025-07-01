import { CacheManager } from '@/common/cache';
import { CACHE_TOKEN } from '@/common/common.module';
import { config } from '@/common/config';
import { generateDbId } from '@/common/utils';
import { BattleResult as BattleResultEnum, EvaluationBattleEntity } from '@/database/entities/evaluation/evaluation-battle.entity';
import { EvaluationRatingHistoryEntity } from '@/database/entities/evaluation/evaluation-rating-history.entity';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ordinal, predictWin, rate, rating } from 'openskill';
import { Repository } from 'typeorm';

const appId = config.server.appId;

export interface OpenSkillRating {
  mu: number;
  sigma: number;
  exposedRating: number;
  totalBattles: number;
  lastUpdated: number;
}

export interface BattleResult {
  winner: 'A' | 'B' | 'DRAW';
  assetAId: string;
  assetBId: string;
  battleId: string;
}

@Injectable()
export class OpenSkillService {
  private readonly logger = new Logger(OpenSkillService.name);

  // Redis Key命名空间
  private readonly REDIS_KEYS = {
    RATINGS: (teamId: string, moduleId: string, assetId: string) => `${appId}:eval:${teamId}:${moduleId}:ratings:${assetId}`,

    LEADERBOARD: (teamId: string, moduleId: string) => `${appId}:eval:${teamId}:${moduleId}:leaderboard`,

    MATCH_POOL: (teamId: string, moduleId: string) => `${appId}:eval:${teamId}:${moduleId}:pool`,

    BATTLE_QUEUE: (teamId: string, moduleId: string) => `${appId}:eval:${teamId}:${moduleId}:battles`,

    BATTLE_CACHE: (teamId: string, moduleId: string) => `${appId}:eval:${teamId}:${moduleId}:battle_cache`,

    MATCH_LOCK: (teamId: string, assetId: string) => `${appId}:eval:${teamId}:match_lock:${assetId}`,

    ASSETS_IN_MODULE: (teamId: string, moduleId: string) => `${appId}:eval:${teamId}:${moduleId}:assets`,

    LEADERBOARD_HISTORY: (teamId: string, moduleId: string) => `${appId}:eval:${teamId}:${moduleId}:leaderboard_history`,
  };

  constructor(
    @Inject(CACHE_TOKEN) private readonly redis: CacheManager,
    @InjectRepository(EvaluationBattleEntity) private readonly battleRepository: Repository<EvaluationBattleEntity>,
    @InjectRepository(EvaluationRatingHistoryEntity) private readonly ratingHistoryRepository: Repository<EvaluationRatingHistoryEntity>,
  ) {}

  /**
   * 创建初始OpenSkill评分
   * 默认参数：mu=25, sigma=8.333
   */
  createInitialRating(): OpenSkillRating {
    const initialRating = rating(); // OpenSkill默认 mu: 25, sigma: 8.333
    return {
      mu: initialRating.mu,
      sigma: initialRating.sigma,
      exposedRating: ordinal(initialRating), // 相当于 mu - 3*sigma
      totalBattles: 0,
      lastUpdated: Date.now(),
    };
  }

  /**
   * 获取资产评分
   */
  async getAssetRating(teamId: string, moduleId: string, assetId: string): Promise<OpenSkillRating | null> {
    const key = this.REDIS_KEYS.RATINGS(teamId, moduleId, assetId);
    const data = await this.redis.hgetall(key);

    if (!data || Object.keys(data).length === 0) {
      return null;
    }

    return {
      mu: parseFloat(data.mu),
      sigma: parseFloat(data.sigma),
      exposedRating: parseFloat(data.exposedRating),
      totalBattles: parseInt(data.totalBattles),
      lastUpdated: parseInt(data.lastUpdated),
    };
  }

  /**
   * 保存资产评分
   */
  async saveAssetRating(teamId: string, moduleId: string, assetId: string, skillRating: OpenSkillRating): Promise<void> {
    const key = this.REDIS_KEYS.RATINGS(teamId, moduleId, assetId);
    const leaderboardKey = this.REDIS_KEYS.LEADERBOARD(teamId, moduleId);

    // 使用Pipeline批量执行Redis操作，提高性能
    if (this.redis.pipeline) {
      const pipeline = this.redis.pipeline();
      pipeline.hset(key, {
        mu: skillRating.mu.toString(),
        sigma: skillRating.sigma.toString(),
        exposedRating: skillRating.exposedRating.toString(),
        totalBattles: skillRating.totalBattles.toString(),
        lastUpdated: skillRating.lastUpdated.toString(),
      });
      pipeline.zadd(leaderboardKey, skillRating.exposedRating, assetId);
      pipeline.expire(key, 30 * 24 * 60 * 60);
      pipeline.expire(leaderboardKey, 30 * 24 * 60 * 60);
      await pipeline.exec();
    } else {
      // Fallback for in-memory cache
      await this.redis.hset(key, {
        mu: skillRating.mu.toString(),
        sigma: skillRating.sigma.toString(),
        exposedRating: skillRating.exposedRating.toString(),
        totalBattles: skillRating.totalBattles.toString(),
        lastUpdated: skillRating.lastUpdated.toString(),
      });
      await this.redis.zadd(leaderboardKey, skillRating.exposedRating, assetId);
      await this.redis.expire(key, 30 * 24 * 60 * 60);
      await this.redis.expire(leaderboardKey, 30 * 24 * 60 * 60);
    }
  }

  /**
   * 添加资产到评测模块
   */
  async addAssetToModule(teamId: string, moduleId: string, assetId: string): Promise<void> {
    const assetsKey = this.REDIS_KEYS.ASSETS_IN_MODULE(teamId, moduleId);
    const poolKey = this.REDIS_KEYS.MATCH_POOL(teamId, moduleId);

    // 检查是否已存在
    const exists = await this.redis.sismember(assetsKey, assetId);
    if (exists) {
      return;
    }

    // 添加到资产集合
    await this.redis.sadd(assetsKey, assetId);

    // 添加到匹配池 (使用当前时间作为分数，用于最近匹配时间排序)
    await this.redis.zadd(poolKey, Date.now(), assetId);

    // 创建初始评分
    const initialRating = this.createInitialRating();
    await this.saveAssetRating(teamId, moduleId, assetId, initialRating);

    // 使用Pipeline设置过期时间
    if (this.redis.pipeline) {
      const pipeline = this.redis.pipeline();
      pipeline.expire(assetsKey, 30 * 24 * 60 * 60);
      pipeline.expire(poolKey, 30 * 24 * 60 * 60);
      await pipeline.exec();
    } else {
      await this.redis.expire(assetsKey, 30 * 24 * 60 * 60);
      await this.redis.expire(poolKey, 30 * 24 * 60 * 60);
    }

    this.logger.log(`Asset ${assetId} added to module ${moduleId} with initial OpenSkill rating`);
  }

  /**
   * 获取模块中的所有资产ID
   */
  async getAssetsInModule(teamId: string, moduleId: string): Promise<string[]> {
    const key = this.REDIS_KEYS.ASSETS_IN_MODULE(teamId, moduleId);
    // Using SSCAN for large sets to avoid blocking Redis
    if ((this.redis as any).redis && (this.redis as any).redis.sscan) {
      let cursor = '0';
      const allAssets = [];
      do {
        const [nextCursor, members] = await (this.redis as any).redis.sscan(key, cursor);
        allAssets.push(...members);
        cursor = nextCursor;
      } while (cursor !== '0');
      return allAssets;
    } else {
      // Fallback to SMEMBERS for in-memory cache or older Redis versions
      return await this.redis.smembers(key);
    }
  }

  /**
   * 更新对战结果并重新计算评分
   */
  async updateBattleResult(teamId: string, moduleId: string, battleResult: BattleResult): Promise<void> {
    const { assetAId, assetBId, winner, battleId } = battleResult;

    // 1. 获取当前评分
    const ratingA = await this.getAssetRating(teamId, moduleId, assetAId);
    const ratingB = await this.getAssetRating(teamId, moduleId, assetBId);

    if (!ratingA || !ratingB) {
      this.logger.error(`Missing ratings for assets in battle ${battleId}: ${assetAId}, ${assetBId}`);
      // 即使没有评分，也应该更新对战记录为错误状态或取消
      return;
    }

    // 2. 转换为OpenSkill格式
    const playerA = { mu: ratingA.mu, sigma: ratingA.sigma };
    const playerB = { mu: ratingB.mu, sigma: ratingB.sigma };

    // 3. 计算新评分
    let newRatings: any[];
    let resultEnum: BattleResultEnum;
    let winnerId: string | undefined;

    if (winner === 'DRAW') {
      newRatings = rate([[playerA], [playerB]], { score: [1, 1] });
      resultEnum = BattleResultEnum.DRAW;
      winnerId = undefined;
    } else if (winner === 'A') {
      newRatings = rate([[playerA], [playerB]], { score: [2, 1] });
      resultEnum = BattleResultEnum.A_WIN;
      winnerId = assetAId;
    } else {
      // B获胜
      newRatings = rate([[playerA], [playerB]], { score: [1, 2] });
      resultEnum = BattleResultEnum.B_WIN;
      winnerId = assetBId;
    }

    // 4. 创建更新后的评分对象
    const updatedA: OpenSkillRating = {
      mu: newRatings[0][0].mu,
      sigma: newRatings[0][0].sigma,
      exposedRating: ordinal(newRatings[0][0]),
      totalBattles: ratingA.totalBattles + 1,
      lastUpdated: Date.now(),
    };

    const updatedB: OpenSkillRating = {
      mu: newRatings[1][0].mu,
      sigma: newRatings[1][0].sigma,
      exposedRating: ordinal(newRatings[1][0]),
      totalBattles: ratingB.totalBattles + 1,
      lastUpdated: Date.now(),
    };

    // 5. 创建评分历史记录
    const historyA = this.ratingHistoryRepository.create({
      id: generateDbId(),
      evaluationModuleId: moduleId,
      assetId: assetAId,
      battleId,
      muBefore: ratingA.mu,
      muAfter: updatedA.mu,
      sigmaBefore: ratingA.sigma,
      sigmaAfter: updatedA.sigma,
      ratingBefore: ratingA.exposedRating,
      ratingAfter: updatedA.exposedRating,
      ratingChange: updatedA.exposedRating - ratingA.exposedRating,
    });

    const historyB = this.ratingHistoryRepository.create({
      id: generateDbId(),
      evaluationModuleId: moduleId,
      assetId: assetBId,
      battleId,
      muBefore: ratingB.mu,
      muAfter: updatedB.mu,
      sigmaBefore: ratingB.sigma,
      sigmaAfter: updatedB.sigma,
      ratingBefore: ratingB.exposedRating,
      ratingAfter: updatedB.exposedRating,
      ratingChange: updatedB.exposedRating - ratingB.exposedRating,
    });

    // 6. 将所有数据库和Redis操作打包到一个Promise.all中
    await Promise.all([
      // 6.1 保存更新后的评分到Redis
      this.saveAssetRating(teamId, moduleId, assetAId, updatedA),
      this.saveAssetRating(teamId, moduleId, assetBId, updatedB),
      // 6.2 持久化完整的对战记录到数据库
      this.battleRepository.update(
        { id: battleId },
        {
          winnerId: winnerId,
          result: resultEnum,
          completedAt: new Date(),
        },
      ),
      // 6.3 保存评分历史记录
      this.ratingHistoryRepository.save([historyA, historyB]),
      // 6.4 缓存对战结果 (for recent battles UI)
      this.cacheBattleResult(teamId, moduleId, battleResult),
    ]).catch((error) => {
      this.logger.error(`Failed to process battle result for battle ${battleId}:`, error);
      // 在这里可以加入更复杂的错误处理逻辑，比如重试
    });

    this.logger.log(`Battle result updated and persisted: ${assetAId} vs ${assetBId}, winner: ${winner}`);
  }

  /**
   * 缓存对战结果
   */
  private async cacheBattleResult(teamId: string, moduleId: string, battleResult: BattleResult): Promise<void> {
    const cacheKey = this.REDIS_KEYS.BATTLE_CACHE(teamId, moduleId);
    const battleData = {
      ...battleResult,
      timestamp: Date.now(),
    };

    // 使用列表存储，保持最近50场对战记录
    await this.redis.lpush(cacheKey, JSON.stringify(battleData));
    await this.redis.ltrim(cacheKey, 0, 49); // 只保留最近50条
    await this.redis.expire(cacheKey, 7 * 24 * 60 * 60); // 7天过期
  }

  /**
   * 获取匹配质量
   */
  calculateMatchQuality(teamId: string, moduleId: string, assetAId: string, assetBId: string, ratingA: OpenSkillRating, ratingB: OpenSkillRating): number {
    const playerA = { mu: ratingA.mu, sigma: ratingA.sigma };
    const playerB = { mu: ratingB.mu, sigma: ratingB.sigma };

    // 使用OpenSkill的predictWin来计算匹配质量
    const winProbabilities = predictWin([[playerA], [playerB]]);

    // 计算匹配质量 (两个概率越接近50%，质量越高)
    const prob1 = winProbabilities[0];
    const prob2 = winProbabilities[1];
    const quality = 1 - Math.abs(prob1 - prob2); // 质量 = 1 - 概率差的绝对值

    return quality;
  }

  /**
   * 获取最优对战
   */
  async getNextOptimalBattle(teamId: string, moduleId: string): Promise<{ assetAId: string; assetBId: string; quality: number } | null> {
    const poolKey = this.REDIS_KEYS.MATCH_POOL(teamId, moduleId);
    const CANDIDATE_POOL_SIZE = 10; // 候选池大小

    // ░░ Step-0: 基础检查 ░░
    const totalAssetsInModule = (await this.getAssetsInModule(teamId, moduleId)).length;
    if (totalAssetsInModule < 2) {
      this.logger.warn(`Not enough assets in module ${moduleId} to create a battle.`);
      return null;
    }

    // ░░ Step-1: 选出候选挑战者池 ░░
    // 从 sorted set 中获取最久未比赛的一批资产
    const candidateIds = await this.redis.zrange(poolKey, 0, CANDIDATE_POOL_SIZE - 1);
    if (candidateIds.length === 0) {
      this.logger.warn(`Match pool for module ${moduleId} is empty.`);
      return null;
    }

    // 批量获取候选者的评分数据
    const candidateRatings = await Promise.all(candidateIds.map((id) => this.getAssetRating(teamId, moduleId, id)));

    const candidates = candidateIds
      .map((id, index) => ({
        assetId: id,
        rating: candidateRatings[index],
      }))
      .filter((c) => c.rating !== null); // 过滤掉可能获取失败的

    if (candidates.length === 0) {
      this.logger.error(`Could not retrieve ratings for any candidates in module ${moduleId}.`);
      return null;
    }

    // ░░ Step-2: 从池中选择最优挑战者 (Sigma最高) ░░
    const challenger = candidates.reduce((a, b) => (a.rating.sigma > b.rating.sigma ? a : b));

    // ░░ Step-3: 为 challenger 寻找最佳对手 ░░
    const allAssetIds = await this.getAssetsInModule(teamId, moduleId);
    const potentialOpponentIds = allAssetIds.filter((id) => id !== challenger.assetId);
    const opponentRatings = await Promise.all(potentialOpponentIds.map((id) => this.getAssetRating(teamId, moduleId, id)));

    let bestOpponent = null;
    let bestScore = -1;

    for (let i = 0; i < potentialOpponentIds.length; i++) {
      const opponentId = potentialOpponentIds[i];
      const opponentRating = opponentRatings[i];

      if (!opponentRating) continue; // 跳过评分获取失败的对手

      // 使用我们之前的比赛质量计算函数
      const quality = this.calculateMatchQuality(teamId, moduleId, challenger.assetId, opponentId, challenger.rating, opponentRating);

      // 在这里，我们只基于比赛质量来选择对手，因为挑战者已经是最优选择
      if (quality > bestScore) {
        bestScore = quality;
        bestOpponent = {
          assetId: opponentId,
          rating: opponentRating,
        };
      }
    }

    if (!bestOpponent) {
      this.logger.warn(`No suitable opponent found for challenger ${challenger.assetId} in module ${moduleId}`);
      return null;
    }

    // ░░ Step-4: 更新匹配时间戳 ░░
    const now = Date.now();
    if (this.redis.pipeline) {
      const pipeline = this.redis.pipeline();
      pipeline.zadd(poolKey, now, challenger.assetId);
      pipeline.zadd(poolKey, now, bestOpponent.assetId);
      await pipeline.exec();
    } else {
      await this.redis.zadd(poolKey, now, challenger.assetId);
      await this.redis.zadd(poolKey, now, bestOpponent.assetId);
    }

    this.logger.log(
      `Optimal battle found for module ${moduleId}: ${challenger.assetId} (sigma: ${challenger.rating.sigma.toFixed(
        2,
      )}) vs ${bestOpponent.assetId} (sigma: ${bestOpponent.rating.sigma.toFixed(2)}) with quality ${bestScore.toFixed(3)}`,
    );

    return {
      assetAId: challenger.assetId,
      assetBId: bestOpponent.assetId,
      quality: bestScore,
    };
  }

  /**
   * 提交对战结果 (内部方法)
   */
  async submitBattleResultInternal(teamId: string, moduleId: string, assetAId: string, assetBId: string, winner: 'A' | 'B' | 'DRAW'): Promise<void> {
    const battleResult: BattleResult = {
      winner,
      assetAId,
      assetBId,
      battleId: generateDbId(),
    };

    await this.updateBattleResult(teamId, moduleId, battleResult);
    this.logger.log(`Battle result submitted: ${assetAId} vs ${assetBId}, winner: ${winner}`);
  }

  /**
   * 获取评测完成状态
   * 基于OpenSkill的sigma值判断是否还需要更多对战
   */
  async getEvaluationStatus(
    teamId: string,
    moduleId: string,
  ): Promise<{
    isComplete: boolean;
    progress: number;
    totalAssets: number;
    stableAssets: number;
    averageSigma: number;
    needsMoreBattles: string[];
  }> {
    const assetIds = await this.getAssetsInModule(teamId, moduleId);
    const totalAssets = assetIds.length;

    if (totalAssets < 2) {
      return { isComplete: true, progress: 100, totalAssets, stableAssets: totalAssets, averageSigma: 0, needsMoreBattles: [] };
    }

    // --- 动态阈值配置 ---
    let config: { MIN_BATTLES: number; COVERAGE: number; WEAK_SIGMA: number; STRONG_SIGMA: number; MODE: string };

    if (totalAssets <= 20) {
      // 冲刺模式 (2-20 assets)
      config = { MIN_BATTLES: 2, COVERAGE: 0.9, WEAK_SIGMA: 7.0, STRONG_SIGMA: 5.5, MODE: 'Sprint' };
    } else if (totalAssets <= 100) {
      // 标准模式 (21-100 assets)
      config = { MIN_BATTLES: 3, COVERAGE: 0.95, WEAK_SIGMA: 6.0, STRONG_SIGMA: 4.5, MODE: 'Standard' };
    } else {
      // 马拉松模式 (101+ assets)
      config = { MIN_BATTLES: 3, COVERAGE: 0.98, WEAK_SIGMA: 5.0, STRONG_SIGMA: 3.5, MODE: 'Marathon' };
    }

    // 1. 批量获取所有资产的评分数据
    const ratings = await Promise.all(assetIds.map((id) => this.getAssetRating(teamId, moduleId, id)));

    // 2. 计算核心指标
    let totalSigma = 0;
    let assetsWithSufficientBattles = 0;
    const needsMoreBattles: string[] = [];

    for (let i = 0; i < totalAssets; i++) {
      const rating = ratings[i];
      const assetId = assetIds[i];

      if (rating) {
        totalSigma += rating.sigma;
        if (rating.totalBattles < config.MIN_BATTLES) {
          needsMoreBattles.push(assetId);
        } else {
          assetsWithSufficientBattles++;
        }
      } else {
        needsMoreBattles.push(assetId);
      }
    }

    const averageSigma = totalAssets > 0 ? totalSigma / totalAssets : 0;
    const battleCoverage = totalAssets > 0 ? assetsWithSufficientBattles / totalAssets : 0;

    // 3. 判断是否满足结束条件
    const hasConvergedStrongly = averageSigma < config.STRONG_SIGMA;
    const hasSufficientCoverage = battleCoverage >= config.COVERAGE && averageSigma < config.WEAK_SIGMA;
    const isComplete = hasConvergedStrongly || hasSufficientCoverage;

    // 4. 计算进度条
    const coverageProgress = Math.min(100, (battleCoverage / config.COVERAGE) * 100);
    const sigmaProgress = Math.min(100, ((8.333 - averageSigma) / (8.333 - config.WEAK_SIGMA)) * 100);
    const progress = Math.round(coverageProgress * 0.7 + sigmaProgress * 0.3);

    this.logger.log(
      `Evaluation status for module ${moduleId} [${config.MODE} Mode]: progress=${progress}%, ` +
        `isComplete=${isComplete} (strongConv=${hasConvergedStrongly}, suffCov=${hasSufficientCoverage}), ` +
        `battleCoverage=${(battleCoverage * 100).toFixed(1)}%/${(config.COVERAGE * 100).toFixed(0)}%, ` +
        `avgSigma=${averageSigma.toFixed(2)} (target: <${config.WEAK_SIGMA} or <${config.STRONG_SIGMA})`,
    );

    return {
      isComplete,
      progress: isComplete ? 100 : Math.max(0, progress),
      totalAssets,
      stableAssets: assetsWithSufficientBattles,
      averageSigma: Math.round(averageSigma * 100) / 100,
      needsMoreBattles,
    };
  }

  /**
   * 获取排行榜
   */
  async getLeaderboard(teamId: string, moduleId: string, page: number = 1, limit: number = 20): Promise<{ items: any[]; total: number; page: number; limit: number }> {
    const leaderboardKey = this.REDIS_KEYS.LEADERBOARD(teamId, moduleId);

    // 获取总数
    const total = (await this.redis.zcard(leaderboardKey)) || 0;

    // 获取分页数据
    const start = (page - 1) * limit;
    const end = start + limit - 1;

    const results = await this.redis.zrevrange(leaderboardKey, start, end, 'WITHSCORES');

    const items = [];
    const assetIds = [];
    for (let i = 0; i < results.length; i += 2) {
      assetIds.push(results[i]);
    }

    if (this.redis.pipeline && assetIds.length > 0) {
      const pipeline = this.redis.pipeline();
      for (const assetId of assetIds) {
        const key = this.REDIS_KEYS.RATINGS(teamId, moduleId, assetId);
        pipeline.hgetall(key);
      }
      const ratingDataArray = await pipeline.exec();

      for (let i = 0; i < assetIds.length; i++) {
        const assetId = assetIds[i];
        const exposedRating = parseFloat(results[i * 2 + 1]);
        const ratingData = ratingDataArray[i][1] as any; // pipeline.exec() returns [error, result] tuples
        const rating: OpenSkillRating | null = ratingData
          ? {
              mu: parseFloat(ratingData.mu),
              sigma: parseFloat(ratingData.sigma),
              exposedRating: parseFloat(ratingData.exposedRating),
              totalBattles: parseInt(ratingData.totalBattles),
              lastUpdated: parseInt(ratingData.lastUpdated),
            }
          : null;

        items.push({
          rank: start + i + 1,
          assetId,
          exposedRating: Math.round(exposedRating),
          mu: rating ? Math.round(rating.mu) : 0,
          sigma: rating ? Math.round(rating.sigma * 100) / 100 : 0,
          totalBattles: rating ? rating.totalBattles : 0,
          lastUpdated: rating ? new Date(rating.lastUpdated) : new Date(),
        });
      }
    } else {
      // Fallback for non-pipeline environments or empty results
      for (let i = 0; i < results.length; i += 2) {
        const assetId = results[i];
        const exposedRating = parseFloat(results[i + 1]);
        const rating = await this.getAssetRating(teamId, moduleId, assetId);
        items.push({
          rank: start + i / 2 + 1,
          assetId,
          exposedRating: Math.round(exposedRating),
          mu: rating ? Math.round(rating.mu) : 0,
          sigma: rating ? Math.round(rating.sigma * 100) / 100 : 0,
          totalBattles: rating ? rating.totalBattles : 0,
          lastUpdated: rating ? new Date(rating.lastUpdated) : new Date(),
        });
      }
    }

    return { items, total, page, limit };
  }

  /**
   * 获取最近对战记录
   */
  async getRecentBattles(teamId: string, moduleId: string, limit: number = 10): Promise<any[]> {
    const cacheKey = this.REDIS_KEYS.BATTLE_CACHE(teamId, moduleId);
    const battles = await this.redis.lrange(cacheKey, 0, limit - 1);

    return battles.map((battle) => JSON.parse(battle));
  }

  /**
   * 批量加入评测
   */
  async joinEvaluation(teamId: string, moduleId: string, assetIds: string[]): Promise<{ addedCount: number }> {
    let addedCount = 0;

    for (const assetId of assetIds) {
      try {
        await this.addAssetToModule(teamId, moduleId, assetId);
        addedCount++;
      } catch (error) {
        this.logger.warn(`Failed to add asset ${assetId} to module ${moduleId}: ${error.message}`);
      }
    }

    return { addedCount };
  }

  /**
   * 清理模块数据
   */
  async cleanupModule(teamId: string, moduleId: string): Promise<void> {
    const patterns = [
      this.REDIS_KEYS.LEADERBOARD(teamId, moduleId),
      this.REDIS_KEYS.MATCH_POOL(teamId, moduleId),
      this.REDIS_KEYS.BATTLE_QUEUE(teamId, moduleId),
      this.REDIS_KEYS.BATTLE_CACHE(teamId, moduleId),
      this.REDIS_KEYS.ASSETS_IN_MODULE(teamId, moduleId),
    ];

    // 删除所有相关键
    await Promise.all(patterns.map((pattern) => this.redis.del(pattern)));

    // 删除所有评分数据
    const assetIds = await this.getAssetsInModule(teamId, moduleId);
    if (assetIds.length > 0) {
      const ratingKeys = assetIds.map((assetId) => this.REDIS_KEYS.RATINGS(teamId, moduleId, assetId));
      await Promise.all(ratingKeys.map((key) => this.redis.del(key)));
    }

    this.logger.log(`Cleaned up OpenSkill data for module ${moduleId}`);
  }
}
