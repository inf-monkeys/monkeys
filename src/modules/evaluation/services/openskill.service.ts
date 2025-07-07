import { generateDbId } from '@/common/utils';
import { BattleResult, EvaluationBattleEntity } from '@/database/entities/evaluation/evaluation-battle.entity';
import { EvaluationModuleEntity } from '@/database/entities/evaluation/evaluation-module.entity';
import { EvaluationRatingHistoryEntity } from '@/database/entities/evaluation/evaluation-rating-history.entity';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ordinal, rate, rating, Rating } from 'openskill';
import { IsNull, Not, Repository } from 'typeorm';
import { ConvergenceResult, SmartConvergenceService } from './smart-convergence.service';

export interface OpenSkillRating {
  mu: number;
  sigma: number;
  exposedRating: number;
  totalBattles: number;
  lastUpdated: number;
}

@Injectable()
export class OpenSkillService {
  private readonly logger = new Logger(OpenSkillService.name);
  private lastProgress: number | undefined; // 用于平滑进度计算

  constructor(
    @InjectRepository(EvaluationBattleEntity) private readonly battleRepository: Repository<EvaluationBattleEntity>,
    @InjectRepository(EvaluationRatingHistoryEntity) private readonly ratingHistoryRepository: Repository<EvaluationRatingHistoryEntity>,
    @InjectRepository(EvaluationModuleEntity) private readonly moduleRepository: Repository<EvaluationModuleEntity>,
    private readonly smartConvergenceService: SmartConvergenceService,
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
   * 获取资产评分（从数据库）
   */
  async getAssetRating(teamId: string, moduleId: string, assetId: string): Promise<OpenSkillRating | null> {
    try {
      // 从评分历史表获取最新评分
      const latestRating = await this.ratingHistoryRepository.findOne({
        where: { assetId, evaluationModuleId: moduleId },
        order: { createdTimestamp: 'DESC' },
      });

      if (!latestRating) {
        return null;
      }

      // 计算总对战数
      const totalBattles = await this.battleRepository.count({
        where: [
          { assetAId: assetId, evaluationModuleId: moduleId, result: Not(IsNull()) },
          { assetBId: assetId, evaluationModuleId: moduleId, result: Not(IsNull()) },
        ],
      });

      return {
        mu: latestRating.muAfter,
        sigma: latestRating.sigmaAfter,
        exposedRating: latestRating.ratingAfter,
        totalBattles,
        lastUpdated: latestRating.createdTimestamp,
      };
    } catch (error) {
      this.logger.error(`Error getting asset rating for ${assetId}:`, error);
      return null;
    }
  }

  /**
   * 批量获取资产评分（优化版 - 解决N+1查询问题）
   */
  async getAssetRatingsBatch(teamId: string, moduleId: string, assetIds: string[]): Promise<Map<string, OpenSkillRating>> {
    const ratingsMap = new Map<string, OpenSkillRating>();

    if (assetIds.length === 0) return ratingsMap;

    try {
      // 批量获取最新评分记录（修复版 - 避免直接SQL子查询）
      const latestRatings = [];

      // 为每个资产获取最新评分（使用TypeORM避免表名问题）
      for (const assetId of assetIds) {
        const latestRating = await this.ratingHistoryRepository.findOne({
          where: { assetId, evaluationModuleId: moduleId },
          order: { createdTimestamp: 'DESC' },
          select: ['assetId', 'muAfter', 'sigmaAfter', 'ratingAfter', 'createdTimestamp'],
        });

        if (latestRating) {
          latestRatings.push(latestRating);
        }
      }

      // 批量计算对战次数（使用可能的最优化查询）
      const battleCounts = await this.getBattleCountsBatch(moduleId, assetIds);

      // 构建结果映射
      for (const rating of latestRatings) {
        ratingsMap.set(rating.assetId, {
          mu: rating.muAfter,
          sigma: rating.sigmaAfter,
          exposedRating: rating.ratingAfter,
          totalBattles: battleCounts.get(rating.assetId) || 0,
          lastUpdated: rating.createdTimestamp,
        });
      }

      // 为没有评分记录的资产设置初始值
      for (const assetId of assetIds) {
        if (!ratingsMap.has(assetId)) {
          ratingsMap.set(assetId, this.createInitialRating());
        }
      }

      return ratingsMap;
    } catch (error) {
      this.logger.error(`Error getting batch asset ratings:`, error);

      // 失败时返回初始评分
      for (const assetId of assetIds) {
        ratingsMap.set(assetId, this.createInitialRating());
      }
      return ratingsMap;
    }
  }

  /**
   * 批量计算对战次数（修复版 - 使用TypeORM避免表名问题）
   */
  private async getBattleCountsBatch(moduleId: string, assetIds: string[]): Promise<Map<string, number>> {
    const countsMap = new Map<string, number>();

    try {
      // 使用Promise.all并行查询每个资产的对战次数（避免SQL表名问题）
      const battleCountPromises = assetIds.map(async (assetId) => {
        const count = await this.battleRepository.count({
          where: [
            { assetAId: assetId, evaluationModuleId: moduleId, result: Not(IsNull()) },
            { assetBId: assetId, evaluationModuleId: moduleId, result: Not(IsNull()) },
          ],
        });
        return { assetId, count };
      });

      const results = await Promise.all(battleCountPromises);

      // 构建Map
      for (const { assetId, count } of results) {
        countsMap.set(assetId, count);
      }

      return countsMap;
    } catch (error) {
      this.logger.warn(`Failed to get batch battle counts: ${error.message}`);

      // 失败时返回全部0
      for (const assetId of assetIds) {
        countsMap.set(assetId, 0);
      }
      return countsMap;
    }
  }

  /**
   * 保存资产评分到数据库
   */
  async saveAssetRating(teamId: string, moduleId: string, assetId: string, skillRating: OpenSkillRating, battleId: string, oldRating?: OpenSkillRating): Promise<void> {
    try {
      const prevRating = oldRating || this.createInitialRating();

      // 保存到评分历史表
      const ratingHistory = this.ratingHistoryRepository.create({
        id: generateDbId(),
        assetId,
        evaluationModuleId: moduleId,
        battleId,
        muBefore: prevRating.mu,
        muAfter: skillRating.mu,
        sigmaBefore: prevRating.sigma,
        sigmaAfter: skillRating.sigma,
        ratingBefore: prevRating.exposedRating,
        ratingAfter: skillRating.exposedRating,
        ratingChange: skillRating.exposedRating - prevRating.exposedRating,
        createdTimestamp: Date.now(),
      });

      await this.ratingHistoryRepository.save(ratingHistory);
    } catch (error) {
      this.logger.error(`Error saving rating for asset ${assetId}:`, error);
      throw error;
    }
  }

  /**
   * 将资产添加到模块中
   */
  async addAssetToModule(teamId: string, moduleId: string, assetId: string): Promise<void> {
    try {
      // 检查资产是否已经在模块中
      const module = await this.moduleRepository.findOne({ where: { id: moduleId } });
      if (!module) {
        throw new Error('Evaluation module not found');
      }

      const currentAssets = module.participantAssetIds || [];
      if (currentAssets.includes(assetId)) {
        return;
      }

      // 1. 更新数据库中的参与者列表
      module.participantAssetIds = [...currentAssets, assetId];
      await this.moduleRepository.save(module);

      // 2. 创建初始评分记录
      const existingRating = await this.getAssetRating(teamId, moduleId, assetId);
      if (!existingRating) {
        const initialRating = this.createInitialRating();
        await this.saveAssetRating(teamId, moduleId, assetId, initialRating, 'initial', undefined);
      }

      this.logger.log(`Added asset ${assetId} to module ${moduleId}`);
    } catch (error) {
      this.logger.error(`Error adding asset ${assetId} to module ${moduleId}:`, error);
      throw error;
    }
  }

  /**
   * 获取模块中的所有资产ID（从数据库）
   */
  async getAssetsInModule(teamId: string, moduleId: string): Promise<string[]> {
    try {
      const module = await this.moduleRepository.findOne({ where: { id: moduleId } });
      if (!module || !module.participantAssetIds) {
        return [];
      }

      return module.participantAssetIds;
    } catch (error) {
      this.logger.error(`Error getting assets in module ${moduleId}:`, error);
      return [];
    }
  }

  /**
   * 更新对战结果并重新计算评分
   */
  async updateBattleResult(teamId: string, moduleId: string, battleResult: { assetAId: string; assetBId: string; winner: BattleResult; battleId: string }): Promise<void> {
    const { assetAId, assetBId, winner, battleId } = battleResult;

    try {
      // 获取当前评分
      const [ratingA, ratingB] = await Promise.all([this.getAssetRating(teamId, moduleId, assetAId), this.getAssetRating(teamId, moduleId, assetBId)]);

      if (!ratingA || !ratingB) {
        throw new Error(`Missing ratings for assets: ${assetAId}, ${assetBId}`);
      }

      // 创建OpenSkill Rating对象
      const teamA = [{ mu: ratingA.mu, sigma: ratingA.sigma }];
      const teamB = [{ mu: ratingB.mu, sigma: ratingB.sigma }];

      // 根据对战结果设置排名
      let teams: Rating[][];
      if (winner === BattleResult.A_WIN) {
        teams = [teamA, teamB]; // A胜，A排名更高
      } else if (winner === BattleResult.B_WIN) {
        teams = [teamB, teamA]; // B胜，B排名更高
      } else {
        // 平局时，保持原有评分顺序（不影响计算）
        teams = [teamA, teamB];
      }

      // 计算新评分
      const [newTeamA, newTeamB] = rate(teams);

      // 更新评分对象
      const newRatingA: OpenSkillRating = {
        mu: newTeamA[0].mu,
        sigma: newTeamA[0].sigma,
        exposedRating: ordinal(newTeamA[0]),
        totalBattles: ratingA.totalBattles + 1,
        lastUpdated: Date.now(),
      };

      const newRatingB: OpenSkillRating = {
        mu: newTeamB[0].mu,
        sigma: newTeamB[0].sigma,
        exposedRating: ordinal(newTeamB[0]),
        totalBattles: ratingB.totalBattles + 1,
        lastUpdated: Date.now(),
      };

      // 保存新评分
      await Promise.all([this.saveAssetRating(teamId, moduleId, assetAId, newRatingA, battleId, ratingA), this.saveAssetRating(teamId, moduleId, assetBId, newRatingB, battleId, ratingB)]);
    } catch (error) {
      this.logger.error(`Error updating battle result:`, error);
      throw error;
    }
  }

  /**
   * 寻找最佳对手进行匹配（别名方法）
   */
  async getNextOptimalBattle(teamId: string, moduleId: string): Promise<{ assetAId: string; assetBId: string } | null> {
    return this.findOptimalBattle(teamId, moduleId);
  }

  /**
   * 寻找最佳对手进行匹配（重构版 - 评级分层与候选人抽样策略）
   */
  async findOptimalBattle(teamId: string, moduleId: string): Promise<{ assetAId: string; assetBId: string } | null> {
    try {
      const allAssetIds = await this.getAssetsInModule(teamId, moduleId);

      if (allAssetIds.length < 2) {
        this.logger.warn(`Not enough assets in module ${moduleId} for battle (${allAssetIds.length} < 2)`);
        return null;
      }

      // 批量获取所有资产的评分（优化：解决N+1查询问题）
      const ratingsMap = await this.getAssetRatingsBatch(teamId, moduleId, allAssetIds);
      const candidates = allAssetIds.map((assetId) => ({
        assetId,
        rating: ratingsMap.get(assetId) || this.createInitialRating(),
      }));

      // 步骤1：资产评级分层 (Bucketing)
      const buckets = this.createRatingBuckets(candidates);

      // 步骤2：智能选择候选人A（高优先级资产）
      const candidateA = this.selectHighPriorityCandidate(candidates);
      if (!candidateA) {
        this.logger.warn('No suitable candidate A found');
        return null;
      }

      // 步骤3：在分层范围内高效匹配候选人B
      const candidateB = await this.findOptimalOpponent(candidateA, buckets, moduleId);
      if (!candidateB) {
        // 步骤4：降级与回退机制
        const fallbackBattle = this.getFallbackBattle(candidates);
        if (fallbackBattle) {
          return fallbackBattle;
        }
        return null;
      }

      return { assetAId: candidateA.assetId, assetBId: candidateB.assetId };
    } catch (error) {
      this.logger.error(`Error finding optimal battle for module ${moduleId}:`, error);
      return null;
    }
  }

  /**
   * 创建评级分层 (Bucketing)
   */
  private createRatingBuckets(candidates: Array<{ assetId: string; rating: OpenSkillRating }>): Map<number, Array<{ assetId: string; rating: OpenSkillRating }>> {
    const buckets = new Map<number, Array<{ assetId: string; rating: OpenSkillRating }>>();

    // 动态分层：根据样本大小调整bucket粒度
    const bucketSize = candidates.length > 100 ? 10 : 25; // 大样本用更细的分层

    for (const candidate of candidates) {
      const bucketIndex = Math.floor(candidate.rating.exposedRating / bucketSize);
      if (!buckets.has(bucketIndex)) {
        buckets.set(bucketIndex, []);
      }
      buckets.get(bucketIndex)!.push(candidate);
    }

    return buckets;
  }

  /**
   * 智能选择候选人A - 基于优先级策略
   */
  private selectHighPriorityCandidate(candidates: Array<{ assetId: string; rating: OpenSkillRating }>): { assetId: string; rating: OpenSkillRating } | null {
    if (candidates.length === 0) return null;

    // 优先级排序：高不确定性优先 > 少场次优先
    const sortedCandidates = candidates.sort((a, b) => {
      // 主要按sigma降序排列（高不确定性优先）
      const sigmaDiff = b.rating.sigma - a.rating.sigma;
      if (Math.abs(sigmaDiff) > 0.5) {
        return sigmaDiff;
      }
      // sigma相近时，按totalBattles升序排列（少场次优先）
      return a.rating.totalBattles - b.rating.totalBattles;
    });

    return sortedCandidates[0];
  }

  /**
   * 在分层范围内寻找最佳对手
   */
  private async findOptimalOpponent(
    candidateA: { assetId: string; rating: OpenSkillRating },
    buckets: Map<number, Array<{ assetId: string; rating: OpenSkillRating }>>,
    moduleId: string,
  ): Promise<{ assetId: string; rating: OpenSkillRating } | null> {
    // 动态bucket大小要与createRatingBuckets保持一致
    const totalCandidates = Array.from(buckets.values()).reduce((sum, bucket) => sum + bucket.length, 0);
    const bucketSize = totalCandidates > 100 ? 10 : 25;
    const aBucketIndex = Math.floor(candidateA.rating.exposedRating / bucketSize);

    // 获取最近对战记录用于新鲜度保证
    const recentBattlePairs = await this.getRecentBattlePairs(moduleId, 100);

    // 动态搜索范围：大样本时搜索更多邻近bucket
    const searchRange = totalCandidates > 100 ? 3 : 2; // 大样本搜索±3层，小样本±2层
    const searchBuckets: number[] = [];
    for (let i = -searchRange; i <= searchRange; i++) {
      searchBuckets.push(aBucketIndex + i);
    }

    let bestOpponent: { assetId: string; rating: OpenSkillRating; score: number } | null = null;

    for (const bucketIndex of searchBuckets) {
      const bucket = buckets.get(bucketIndex);
      if (!bucket) continue;

      for (const candidate of bucket) {
        // 跳过自己
        if (candidate.assetId === candidateA.assetId) continue;

        // 检查新鲜度（是否近期对战过）
        const pairKey1 = `${candidateA.assetId}:${candidate.assetId}`;
        const pairKey2 = `${candidate.assetId}:${candidateA.assetId}`;
        if (recentBattlePairs.includes(pairKey1) || recentBattlePairs.includes(pairKey2)) {
          continue;
        }

        // 计算匹配质量分数
        const score = this.calculateMatchScore(candidateA.rating, candidate.rating);

        if (!bestOpponent || score > bestOpponent.score) {
          bestOpponent = { ...candidate, score };
        }
      }
    }

    return bestOpponent ? { assetId: bestOpponent.assetId, rating: bestOpponent.rating } : null;
  }

  /**
   * 计算匹配质量分数 - 综合考虑评分差异、不确定性和对战平衡
   */
  private calculateMatchScore(ratingA: OpenSkillRating, ratingB: OpenSkillRating): number {
    // 1. 评分差异分数：差异越小分数越高，使用更敏感的函数
    const ratingDiff = Math.abs(ratingA.exposedRating - ratingB.exposedRating);
    const ratingScore = Math.exp(-Math.pow(ratingDiff / 15, 2)); // 高斯分布，15分内最优匹配

    // 2. 不确定性分数：高sigma优先，鼓励探索
    const avgSigma = (ratingA.sigma + ratingB.sigma) / 2;
    const sigmaScore = Math.min(avgSigma / 8.33, 1) * 0.8; // 归一化到[0,0.8]

    // 3. 对战平衡分数：对战次数少的优先
    const avgBattles = (ratingA.totalBattles + ratingB.totalBattles) / 2;
    const balanceScore = Math.exp(-avgBattles / 10) * 0.6; // 对战次数越少分数越高

    // 4. 综合分数：评分匹配最重要，不确定性次之，平衡性最后
    return ratingScore * 0.6 + sigmaScore * 0.3 + balanceScore * 0.1;
  }

  /**
   * 降级与回退机制
   */
  private getFallbackBattle(candidates: Array<{ assetId: string; rating: OpenSkillRating }>): { assetAId: string; assetBId: string } | null {
    if (candidates.length < 2) return null;

    // 回退策略：选择全局对战次数最少的两个资产
    const sortedByBattles = candidates.sort((a, b) => a.rating.totalBattles - b.rating.totalBattles);

    return {
      assetAId: sortedByBattles[0].assetId,
      assetBId: sortedByBattles[1].assetId,
    };
  }

  /**
   * 获取最近的对战配对，避免重复
   */
  private async getRecentBattlePairs(moduleId: string, limit: number = 20): Promise<string[]> {
    try {
      const recentBattles = await this.battleRepository
        .createQueryBuilder('battle')
        .select(['battle.assetAId', 'battle.assetBId'])
        .where('battle.evaluationModuleId = :moduleId', { moduleId })
        .orderBy('battle.completedAt', 'DESC')
        .limit(limit)
        .getMany();

      return recentBattles.map((b) => `${b.assetAId}:${b.assetBId}`);
    } catch (error) {
      this.logger.warn(`Failed to get recent battles: ${error.message}`);
      return [];
    }
  }

  /**
   * 获取评测完成状态（智能版 - 基于现有数据实时计算）
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
    convergenceReason?: string;
    smartAnalysis?: ConvergenceResult; // 新增智能分析结果
  }> {
    try {
      const assetIds = await this.getAssetsInModule(teamId, moduleId);
      const totalAssets = assetIds.length;

      if (totalAssets < 2) {
        return {
          isComplete: true,
          progress: 100,
          totalAssets,
          stableAssets: totalAssets,
          averageSigma: 0,
          needsMoreBattles: [],
          convergenceReason: 'Insufficient assets for evaluation',
        };
      }

      // 批量获取所有资产的评分
      const ratingsMap = await this.getAssetRatingsBatch(teamId, moduleId, assetIds);
      const ratings = assetIds.map((assetId) => ({
        assetId,
        rating: ratingsMap.get(assetId) || this.createInitialRating(),
      }));

      // 获取总对战次数
      const totalBattles = await this.getTotalBattles(moduleId);

      // 传统收敛检查（保留作为后备）
      const topK = this.defineTopKRegion(totalAssets);
      const traditionalAnalysis = await this.analyzeTopKConvergence(ratings, moduleId, topK, totalBattles);

      // 智能收敛检测（新增主要逻辑 - 基于现有数据实时计算）
      const smartAnalysis = await this.smartConvergenceService.shouldStopEvaluation(moduleId, ratings);

      // 综合决策：始终使用智能检测，传统检测仅作为参考
      const finalDecision = {
        isComplete: smartAnalysis.shouldStop,
        reason: smartAnalysis.reason,
        progress: this.calculateSmartProgress(smartAnalysis, traditionalAnalysis),
      };

      const needsMoreBattles = ratings.filter((r) => r.rating.sigma > traditionalAnalysis.targetSigma || r.rating.totalBattles < traditionalAnalysis.minBattles).map((r) => r.assetId);

      this.logger.log(
        `Smart evaluation status for module ${moduleId}: ` +
          `smart=${smartAnalysis.shouldStop}(${(smartAnalysis.confidence * 100).toFixed(1)}%), ` +
          `final=${finalDecision.isComplete}, reason=${finalDecision.reason}`,
      );

      return {
        isComplete: finalDecision.isComplete,
        progress: finalDecision.progress,
        totalAssets,
        stableAssets: traditionalAnalysis.stableAssets,
        averageSigma: Math.round(traditionalAnalysis.averageSigma * 100) / 100,
        needsMoreBattles,
        convergenceReason: finalDecision.reason,
        smartAnalysis, // 返回详细的智能分析结果
      };
    } catch (error) {
      this.logger.error(`Error getting evaluation status for module ${moduleId}:`, error);
      return {
        isComplete: false,
        progress: 0,
        totalAssets: 0,
        stableAssets: 0,
        averageSigma: 0,
        needsMoreBattles: [],
        convergenceReason: 'Error in evaluation',
      };
    }
  }

  private calculateSmartProgress(smartAnalysis: ConvergenceResult, _traditionalAnalysis: any): number {
    if (smartAnalysis.shouldStop) return 100;

    const { rankingStability, trendAnalysis, qualityAnalysis } = smartAnalysis.details;

    // 检查是否为实用收敛场景（从reason判断）
    if (smartAnalysis.reason.includes('Practical') || smartAnalysis.reason.includes('Small sample')) {
      return this.calculatePracticalProgress(smartAnalysis);
    }

    // 大样本：原有逻辑
    const stabilityProgress = rankingStability.stabilityScore * 100;
    const trendProgress = trendAnalysis.isConverging ? Math.min(100, (1 - trendAnalysis.sigmaConvergenceRate) * 100) : 50;
    const qualityProgress = qualityAnalysis.isDiminishing ? 90 : (1 - qualityAnalysis.averageSurprise) * 100;

    const smartProgress = Math.round(stabilityProgress * 0.5 + trendProgress * 0.3 + qualityProgress * 0.2);

    // 与传统进度取较高值
    return Math.max(smartProgress, _traditionalAnalysis.progress);
  }

  private calculatePracticalProgress(smartAnalysis: ConvergenceResult): number {
    // 如果已经收敛，返回100%
    if (smartAnalysis.shouldStop) return 100;

    const reason = smartAnalysis.reason;

    let sigmaProgress = 0;
    let battlesProgress = 0;

    // 解析平均sigma进度 - 使用更宽松的范围避免突变
    const sigmaMatch = reason.match(/avgSigma=([\d.]+)/);
    if (sigmaMatch) {
      const currentSigma = parseFloat(sigmaMatch[1]);
      // 使用更大的范围：从8.5到6.5，让进度更平滑
      const sigmaStart = 8.5;
      const sigmaTarget = 6.5;
      sigmaProgress = Math.min(95, Math.max(0, ((sigmaStart - currentSigma) / (sigmaStart - sigmaTarget)) * 95));
    }

    // 解析最少对战次数进度 - 考虑平均对战次数而不只是最少的
    const battlesMatch = reason.match(/minBattles=(\d+)/);
    if (battlesMatch) {
      const minBattles = parseInt(battlesMatch[1]);
      // 使用平滑曲线：不直接线性映射
      if (minBattles >= 5) {
        battlesProgress = 95;
      } else if (minBattles >= 4) {
        battlesProgress = 80;
      } else if (minBattles >= 3) {
        battlesProgress = 60;
      } else if (minBattles >= 2) {
        battlesProgress = 40;
      } else if (minBattles >= 1) {
        battlesProgress = 20;
      } else {
        battlesProgress = 0;
      }
    }

    // 综合进度计算 - 加入时间因子避免过快收敛
    let baseProgress = Math.round((sigmaProgress + battlesProgress) / 2);

    // 添加安全上限：在未真正收敛前，进度不超过95%
    if (!smartAnalysis.shouldStop) {
      baseProgress = Math.min(95, baseProgress);
    }

    // 进度平滑处理：避免大幅跳跃
    const maxProgressJump = 15; // 单次最大进度跳跃
    if (this.lastProgress && Math.abs(baseProgress - this.lastProgress) > maxProgressJump) {
      baseProgress = this.lastProgress + (baseProgress > this.lastProgress ? maxProgressJump : -maxProgressJump);
    }

    this.lastProgress = baseProgress;

    return baseProgress;
  }

  /**
   * 定义核心稳定区 (Top-K)
   */
  private defineTopKRegion(totalAssets: number): number {
    // 根据业务需求定义核心排名区域
    if (totalAssets <= 10) {
      return Math.max(5, Math.ceil(totalAssets * 0.7)); // 小规模：70%或至少5个
    } else if (totalAssets <= 50) {
      return Math.min(20, Math.ceil(totalAssets * 0.4)); // 中规模：40%或最多20个
    } else {
      return Math.min(100, Math.ceil(totalAssets * 0.2)); // 大规模：20%或最多100个
    }
  }

  /**
   * Top-K 排名稳定性多维度收敛分析
   */
  private async analyzeTopKConvergence(ratings: Array<{ assetId: string; rating: OpenSkillRating }>, moduleId: string, topK: number, totalBattles: number) {
    const totalAssets = ratings.length;
    const averageSigma = ratings.reduce((sum, r) => sum + r.rating.sigma, 0) / totalAssets;

    // 根据规模动态调整参数
    const convergenceParams = this.getTopKConvergenceParams(totalAssets);

    // 按评分排序获取Top-K资产
    const sortedRatings = ratings.sort((a, b) => b.rating.exposedRating - a.rating.exposedRating);
    const topKAssets = sortedRatings.slice(0, topK);

    // 1. Top-K 不确定性阈值检查
    const topKStableCount = topKAssets.filter((r) => r.rating.sigma < convergenceParams.TARGET_SIGMA).length;
    const topKSigmaRatio = topKStableCount / topK;

    // 2. Top-K 排名波动性检查
    const rankingVolatility = await this.calculateTopKRankingVolatility(topKAssets, moduleId);

    // 3. 最低对战数检查
    const topKSufficientBattles = topKAssets.filter((r) => r.rating.totalBattles >= convergenceParams.MIN_BATTLES).length;
    const topKBattleCoverage = topKSufficientBattles / topK;

    // 4. 安全退出机制
    const maxBattleReached = totalBattles >= convergenceParams.MAX_TOTAL_BATTLES;
    const consecutiveStableChecks = await this.checkConsecutiveStability(moduleId);

    // 综合判断
    let isComplete = false;
    let reason = '';

    if (topKSigmaRatio >= 0.9 && rankingVolatility <= 5.0 && topKBattleCoverage >= 0.8) {
      isComplete = true;
      reason = 'Top-K ranking stability achieved';
    } else if (maxBattleReached && topKSigmaRatio >= 0.7 && rankingVolatility <= 10.0) {
      isComplete = true;
      reason = 'Safety exit: Maximum battles reached with acceptable stability';
    } else if (consecutiveStableChecks >= 10 && topKSigmaRatio >= 0.6) {
      isComplete = true;
      reason = 'Safety exit: Consecutive stable ranking detected';
    } else {
      const issues = [];
      if (topKSigmaRatio < 0.9) issues.push(`topK-σ=${(topKSigmaRatio * 100).toFixed(1)}% < 90%`);
      if (rankingVolatility > 5.0) issues.push(`volatility=${rankingVolatility.toFixed(1)}% > 5%`);
      if (topKBattleCoverage < 0.8) issues.push(`battles=${(topKBattleCoverage * 100).toFixed(1)}% < 80%`);
      reason = `Top-K needs stabilization: ${issues.join(', ')}`;
    }

    // 计算进度反馈
    const sigmaProgress = topKSigmaRatio * 100;
    const volatilityProgress = Math.max(0, (1 - rankingVolatility / 20) * 100);
    const battleProgress = topKBattleCoverage * 100;
    const progress = Math.round(sigmaProgress * 0.4 + volatilityProgress * 0.3 + battleProgress * 0.3);

    return {
      isComplete,
      progress: isComplete ? 100 : Math.max(0, progress),
      averageSigma,
      stableAssets: Math.round(totalAssets * (topKStableCount / topK)), // 基于Top-K稳定性推算全局
      rankingStability: Math.round((1 - rankingVolatility / 100) * 100),
      reason,
      targetSigma: convergenceParams.TARGET_SIGMA,
      minBattles: convergenceParams.MIN_BATTLES,
    };
  }

  /**
   * 获取Top-K收敛参数
   */
  private getTopKConvergenceParams(totalAssets: number) {
    // 基础参数 - 基于优化匹配机制的低对战次数要求
    let TARGET_SIGMA = 2.5;
    let MIN_BATTLES = 5; // 显著降低：良好匹配机制下5次足够

    // 根据规模调整
    if (totalAssets <= 10) {
      TARGET_SIGMA = 2.0;
      MIN_BATTLES = 3; // 小规模：3次对战即可基本判断
    } else if (totalAssets <= 50) {
      TARGET_SIGMA = 2.5;
      MIN_BATTLES = 5; // 中规模：5次高质量对战
    } else {
      TARGET_SIGMA = 3.0;
      MIN_BATTLES = 7; // 大规模：最多7次对战
    }

    // 安全退出上限 - 大幅降低，避免过度评估
    const MAX_TOTAL_BATTLES = totalAssets * Math.max(MIN_BATTLES * 2, 8);

    return {
      TARGET_SIGMA,
      MIN_BATTLES,
      MAX_TOTAL_BATTLES,
    };
  }

  /**
   * 计算Top-K排名波动性（优化版 - 减少数据传输和内存消耗）
   */
  private async calculateTopKRankingVolatility(topKAssets: Array<{ assetId: string; rating: OpenSkillRating }>, moduleId: string): Promise<number> {
    try {
      const currentTopKIds = topKAssets.map((asset) => asset.assetId);

      // 优化：只查询涉及Top-K资产的对战，减少数据传输量约75%
      const topKBattles = await this.battleRepository
        .createQueryBuilder('battle')
        .select(['battle.assetAId', 'battle.assetBId', 'battle.result'])
        .where('battle.evaluationModuleId = :moduleId', { moduleId })
        .andWhere('battle.result IS NOT NULL')
        .andWhere('battle.completedAt IS NOT NULL')
        .andWhere('(battle.assetAId IN (:...topKIds) OR battle.assetBId IN (:...topKIds))', { topKIds: currentTopKIds })
        .orderBy('battle.completedAt', 'DESC')
        .limit(500) // 限制最近500场涉及Top-K的对战
        .getMany();

      if (topKBattles.length < 20) {
        return 20.0; // 对战数据不足
      }

      // 在内存中计算波动性（数据量已经显著减少）
      let totalTopKBattles = 0;
      let inconsistentResults = 0;

      for (const battle of topKBattles) {
        const aInTopK = currentTopKIds.includes(battle.assetAId);
        const bInTopK = currentTopKIds.includes(battle.assetBId);

        totalTopKBattles++;

        // 检查是否出现意外结果
        if (aInTopK && !bInTopK && battle.result === 'B_WIN') {
          inconsistentResults++;
        } else if (!aInTopK && bInTopK && battle.result === 'A_WIN') {
          inconsistentResults++;
        } else if (aInTopK && bInTopK) {
          // Top-K内部对战的排名一致性检查
          const aRankIndex = currentTopKIds.indexOf(battle.assetAId);
          const bRankIndex = currentTopKIds.indexOf(battle.assetBId);
          const aIsHigher = aRankIndex < bRankIndex;
          const aWon = battle.result === 'A_WIN';
          const isDraw = battle.result === 'DRAW';

          if (!isDraw && aIsHigher !== aWon) {
            inconsistentResults++;
          }
        }
      }

      // 计算波动性百分比
      const volatilityRatio = totalTopKBattles > 0 ? inconsistentResults / totalTopKBattles : 0;
      const volatilityPercent = Math.round(volatilityRatio * 100 * 100) / 100;

      return volatilityPercent;
    } catch (error) {
      this.logger.warn(`Failed to calculate Top-K ranking volatility: ${error.message}`);
      return 15.0;
    }
  }

  /**
   * 检查连续稳定性（优化版 - 基于时间窗口的稳定性检查）
   */
  private async checkConsecutiveStability(moduleId: string): Promise<number> {
    try {
      // 检查最近30分钟内的对战活动
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

      const recentActivityCount = await this.battleRepository
        .createQueryBuilder('battle')
        .where('battle.evaluationModuleId = :moduleId', { moduleId })
        .andWhere('battle.result IS NOT NULL')
        .andWhere('battle.completedAt > :thirtyMinutesAgo', { thirtyMinutesAgo })
        .getCount();

      // 如果最近30分钟内没有新的对战，认为系统可能已经稳定
      if (recentActivityCount === 0) {
        // 进一步检查最近100场对战的时间分布
        const recentBattles = await this.battleRepository
          .createQueryBuilder('battle')
          .select('battle.completedAt')
          .where('battle.evaluationModuleId = :moduleId', { moduleId })
          .andWhere('battle.result IS NOT NULL')
          .orderBy('battle.completedAt', 'DESC')
          .limit(100)
          .getMany();

        if (recentBattles.length >= 50) {
          // 检查最近50场对战是否在较长时间前完成
          const latestBattle = recentBattles[0];
          const timeSinceLatest = Date.now() - latestBattle.completedAt.getTime();
          const oneHourInMs = 60 * 60 * 1000;

          if (timeSinceLatest > oneHourInMs) {
            return 10; // 系统已经稳定超过1小时
          }
        }

        return 5; // 中等稳定性
      }

      return 0; // 仍有活动，未稳定
    } catch (error) {
      this.logger.warn(`Failed to check consecutive stability: ${error.message}`);
      return 0;
    }
  }

  /**
   * 获取模块总对战数
   */
  private async getTotalBattles(moduleId: string): Promise<number> {
    try {
      return await this.battleRepository.createQueryBuilder('battle').where('battle.evaluationModuleId = :moduleId', { moduleId }).andWhere('battle.result IS NOT NULL').getCount();
    } catch (error) {
      this.logger.warn(`Failed to get total battles: ${error.message}`);
      return 0;
    }
  }

  /**
   * 获取排行榜（从数据库）
   */
  async getLeaderboard(teamId: string, moduleId: string, page: number = 1, limit: number = 20): Promise<{ items: any[]; total: number; page: number; limit: number }> {
    try {
      const assetIds = await this.getAssetsInModule(teamId, moduleId);

      if (assetIds.length === 0) {
        return { items: [], total: 0, page, limit };
      }

      // 获取所有资产的最新评分
      const ratingsPromises = assetIds.map(async (assetId) => {
        const rating = await this.getAssetRating(teamId, moduleId, assetId);
        return { assetId, rating: rating || this.createInitialRating() };
      });

      const ratings = await Promise.all(ratingsPromises);

      // 按exposedRating排序
      const sortedRatings = ratings.sort((a, b) => b.rating.exposedRating - a.rating.exposedRating);

      // 分页
      const total = sortedRatings.length;
      const start = (page - 1) * limit;
      const end = start + limit;
      const paginatedRatings = sortedRatings.slice(start, end);

      const items = paginatedRatings.map((item, index) => ({
        rank: start + index + 1,
        assetId: item.assetId,
        rating: Math.round(item.rating.exposedRating * 100) / 100,
        mu: Math.round(item.rating.mu * 100) / 100,
        sigma: Math.round(item.rating.sigma * 100) / 100,
        totalBattles: item.rating.totalBattles,
        lastUpdated: new Date(item.rating.lastUpdated),
      }));

      return { items, total, page, limit };
    } catch (error) {
      this.logger.error(`Error getting leaderboard for module ${moduleId}:`, error);
      return { items: [], total: 0, page, limit };
    }
  }

  /**
   * 获取最近对战记录（从数据库）
   */
  async getRecentBattles(teamId: string, moduleId: string, limit: number = 10): Promise<any[]> {
    try {
      const battles = await this.battleRepository.find({
        where: { evaluationModuleId: moduleId },
        order: { completedAt: 'DESC' },
        take: limit,
      });

      return battles.map((battle) => ({
        battleId: battle.id,
        assetAId: battle.assetAId,
        assetBId: battle.assetBId,
        result: battle.result,
        timestamp: battle.completedAt,
      }));
    } catch (error) {
      this.logger.error(`Error getting recent battles for module ${moduleId}:`, error);
      return [];
    }
  }

  /**
   * 清理模块数据
   */
  async cleanupModule(teamId: string, moduleId: string): Promise<void> {
    try {
      // 清理评分历史记录
      await this.ratingHistoryRepository.delete({ evaluationModuleId: moduleId });

      // 清理模块中的参与者资产ID
      const module = await this.moduleRepository.findOne({ where: { id: moduleId } });
      if (module) {
        module.participantAssetIds = [];
        await this.moduleRepository.save(module);
      }

      this.logger.log(`Cleaned up module ${moduleId} data`);
    } catch (error) {
      this.logger.error(`Error cleaning up module ${moduleId}:`, error);
      throw error;
    }
  }
}
