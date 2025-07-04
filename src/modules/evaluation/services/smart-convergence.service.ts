import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as ss from 'simple-statistics';
import * as _ from 'lodash';
import { config } from '@/common/config';
import { EvaluationBattleEntity } from '@/database/entities/evaluation/evaluation-battle.entity';
import { EvaluationRatingHistoryEntity } from '@/database/entities/evaluation/evaluation-rating-history.entity';

const appId = config.server.appId;

export interface ConvergenceResult {
  shouldStop: boolean;
  reason: string;
  confidence: number;
  details: {
    rankingStability: RankingStabilityResult;
    trendAnalysis: TrendAnalysisResult;
    qualityAnalysis: QualityAnalysisResult;
  };
}

export interface RankingStabilityResult {
  isStable: boolean;
  stabilityScore: number;
  consecutiveStableWindows: number;
  windowAnalysis: TimeWindowAnalysis[];
}

export interface TimeWindowAnalysis {
  windowIndex: number;
  battleCount: number;
  timestamp: Date;
  ranking: string[];
  averageSigma: number;
  similarity?: number;
}

export interface TrendAnalysisResult {
  sigmaConvergenceRate: number;
  predictedConvergenceBattles: number;
  isConverging: boolean;
  recentTrend: 'improving' | 'stable' | 'degrading';
}

export interface QualityAnalysisResult {
  averageSurprise: number;
  isDiminishing: boolean;
  recentQualityScore: number;
}

@Injectable()
export class SmartConvergenceService {
  private readonly logger = new Logger(SmartConvergenceService.name);

  constructor(
    @InjectRepository(EvaluationBattleEntity)
    private readonly battleRepository: Repository<EvaluationBattleEntity>,
    @InjectRepository(EvaluationRatingHistoryEntity)
    private readonly ratingHistoryRepository: Repository<EvaluationRatingHistoryEntity>,
  ) {}

  /**
   * 主要判断逻辑：高性能版本
   */
  async shouldStopEvaluation(moduleId: string, currentRankings: Array<{ assetId: string; rating: any }>): Promise<ConvergenceResult> {
    try {
      const assetCount = currentRankings.length;

      // 实用收敛标准：针对不同规模使用不同策略
      if (assetCount < 500) {
        // 中小规模（< 500）：使用实用标准
        return await this.handlePracticalEvaluation(moduleId, currentRankings);
      }

      // 超大样本（≥ 500）使用复杂统计分析
      const [rankingStability, trendAnalysis, qualityAnalysis] = await Promise.all([
        this.checkRankingStabilityOptimized(moduleId, currentRankings),
        this.analyzeTrendOptimized(moduleId),
        this.analyzeBattleQualityOptimized(moduleId),
      ]);

      const avgSigma = currentRankings.reduce((sum, r) => sum + r.rating.sigma, 0) / assetCount;
      const totalBattles = await this.getTotalBattles(moduleId);

      return this.makeConvergenceDecision(rankingStability, trendAnalysis, qualityAnalysis, assetCount, totalBattles, avgSigma);
    } catch (error) {
      this.logger.error(`Error in smart convergence detection: ${error.message}`);
      this.logger.error(`Error stack: ${error.stack}`);
      return this.getDefaultConvergenceResult();
    }
  }

  /**
   * 高性能排名稳定性检测：一次查询获取所有时间窗口数据
   */
  private async checkRankingStabilityOptimized(moduleId: string, currentRankings: Array<{ assetId: string; rating: any }>): Promise<RankingStabilityResult> {
    const totalBattles = await this.getTotalBattles(moduleId);
    const assetCount = currentRankings.length;

    if (totalBattles < 100) {
      return {
        isStable: false,
        stabilityScore: Math.min(0.6, (totalBattles / 100) * 0.6),
        consecutiveStableWindows: 0,
        windowAnalysis: [],
      };
    }

    const windowSize = assetCount >= 500 ? 20 : 10;
    const numWindows = Math.min(6, Math.floor(totalBattles / windowSize));

    if (numWindows < 2) {
      return {
        isStable: false,
        stabilityScore: 0,
        consecutiveStableWindows: 0,
        windowAnalysis: [],
      };
    }

    // 🚀 高性能：一次查询获取所有时间窗口数据
    const windowData = await this.getAllTimeWindowsOptimized(moduleId, windowSize, numWindows);

    // 添加当前排名作为最新窗口
    const currentWindow: TimeWindowAnalysis = {
      windowIndex: numWindows,
      battleCount: totalBattles,
      timestamp: new Date(),
      ranking: currentRankings.sort((a, b) => b.rating.exposedRating - a.rating.exposedRating).map((r) => r.assetId),
      averageSigma: currentRankings.reduce((sum, r) => sum + r.rating.sigma, 0) / currentRankings.length,
    };

    const allWindows = [...windowData, currentWindow];

    // 批量计算相似度
    let consecutiveStable = 0;
    let totalStability = 0;
    let stabilityCount = 0;

    for (let i = 1; i < allWindows.length; i++) {
      const similarity = this.calculateRankingSimilarity(allWindows[i - 1].ranking, allWindows[i].ranking);

      allWindows[i].similarity = similarity;
      totalStability += similarity;
      stabilityCount++;

      if (similarity > 0.75) {
        consecutiveStable++;
      } else {
        consecutiveStable = 0;
      }
    }

    const avgStability = stabilityCount > 0 ? totalStability / stabilityCount : 0;

    return {
      isStable: consecutiveStable >= 1,
      stabilityScore: avgStability,
      consecutiveStableWindows: consecutiveStable,
      windowAnalysis: allWindows,
    };
  }

  /**
   * 🚀 一次查询获取所有时间窗口数据（高性能，正确处理多租户表名）
   */
  private async getAllTimeWindowsOptimized(moduleId: string, windowSize: number, numWindows: number): Promise<TimeWindowAnalysis[]> {
    // 使用CTE和窗口函数一次性获取所有窗口数据，正确处理多租户表名
    const rawQuery = `
      WITH ranked_history AS (
        SELECT 
          asset_id,
          rating_after,
          sigma_after,
          created_timestamp,
          ROW_NUMBER() OVER (ORDER BY created_timestamp ASC) as battle_seq,
          FLOOR((ROW_NUMBER() OVER (ORDER BY created_timestamp ASC) - 1) / $2) as window_id
        FROM "${appId}_evaluation_rating_history"
        WHERE evaluation_module_id = $1
      ),
      window_rankings AS (
        SELECT 
          window_id,
          asset_id,
          rating_after,
          sigma_after,
          created_timestamp,
          ROW_NUMBER() OVER (PARTITION BY window_id ORDER BY rating_after DESC) as rank_in_window
        FROM ranked_history 
        WHERE window_id < $3
      ),
      latest_per_asset_window AS (
        SELECT 
          window_id,
          asset_id,
          rating_after,
          sigma_after,
          created_timestamp,
          ROW_NUMBER() OVER (PARTITION BY window_id, asset_id ORDER BY created_timestamp DESC) as latest_rank
        FROM window_rankings
      )
      SELECT 
        window_id,
        ARRAY_AGG(asset_id ORDER BY rating_after DESC) as ranking,
        AVG(sigma_after) as avg_sigma,
        MIN(created_timestamp) as window_start_time
      FROM latest_per_asset_window 
      WHERE latest_rank = 1
      GROUP BY window_id 
      ORDER BY window_id;
    `;

    const results = await this.ratingHistoryRepository.query(rawQuery, [moduleId, windowSize, numWindows]);

    return results.map((row: any) => ({
      windowIndex: row.window_id,
      battleCount: (row.window_id + 1) * windowSize,
      timestamp: row.window_start_time,
      ranking: row.ranking || [],
      averageSigma: parseFloat(row.avg_sigma) || 0,
    }));
  }

  /**
   * 🚀 高性能趋势分析：采样 + 批量统计
   */
  private async analyzeTrendOptimized(moduleId: string): Promise<TrendAnalysisResult> {
    // 采样策略：每100条记录采样1条，大幅减少数据量
    const sampledData = await this.ratingHistoryRepository.query(
      `
      WITH sampled_history AS (
        SELECT 
          created_timestamp,
          sigma_after,
          ROW_NUMBER() OVER (ORDER BY created_timestamp DESC) as rn
        FROM "${appId}_evaluation_rating_history"
        WHERE evaluation_module_id = $1
      )
      SELECT 
        EXTRACT(EPOCH FROM created_timestamp) / 3600 as time_hour,
        AVG(sigma_after) as avg_sigma
      FROM sampled_history 
      WHERE rn % 100 = 1
      GROUP BY EXTRACT(EPOCH FROM created_timestamp) / 3600
      ORDER BY time_hour DESC
      LIMIT 20;
    `,
      [moduleId],
    );

    if (sampledData.length < 3) {
      return {
        sigmaConvergenceRate: 0,
        predictedConvergenceBattles: Infinity,
        isConverging: false,
        recentTrend: 'stable',
      };
    }

    // 线性回归分析
    const timePoints = sampledData.map((row: any) => [parseFloat(row.time_hour), parseFloat(row.avg_sigma)]);
    const regression = ss.linearRegression(timePoints);

    const convergenceRate = -regression.m;
    const isConverging = convergenceRate > 0.001;

    // 预测收敛时间
    const currentSigma = sampledData[0].avg_sigma;
    const targetSigma = 2.5;

    let predictedConvergenceBattles = Infinity;
    if (isConverging && currentSigma > targetSigma) {
      const remainingDrop = currentSigma - targetSigma;
      const timeToConverge = remainingDrop / convergenceRate;
      predictedConvergenceBattles = Math.max(0, timeToConverge * 10);
    }

    // 判断趋势方向
    const recentTrend = this.analyzeTrendDirection(
      sampledData.slice(0, 5).map((row: any) => ({
        time: parseFloat(row.time_hour),
        avgSigma: parseFloat(row.avg_sigma),
      })),
    );

    return {
      sigmaConvergenceRate: convergenceRate,
      predictedConvergenceBattles,
      isConverging,
      recentTrend,
    };
  }

  /**
   * 🚀 高性能对战质量分析：批量预加载评分数据
   */
  private async analyzeBattleQualityOptimized(moduleId: string): Promise<QualityAnalysisResult> {
    // 批量获取最近30场对战及其评分数据，正确处理多租户表名
    const recentBattlesWithRatings = await this.ratingHistoryRepository.query(
      `
      WITH recent_battles AS (
        SELECT 
          asset_a_id,
          asset_b_id,
          result,
          completed_at,
          ROW_NUMBER() OVER (ORDER BY completed_at DESC) as rn
        FROM "${appId}_evaluation_battles"
        WHERE evaluation_module_id = $1 
          AND result IS NOT NULL
        ORDER BY completed_at DESC
        LIMIT 30
      ),
      battle_ratings AS (
        SELECT 
          rb.*,
          rh_a.rating_after as rating_a,
          rh_b.rating_after as rating_b
        FROM recent_battles rb
        LEFT JOIN "${appId}_evaluation_rating_history" rh_a ON (
          rh_a.asset_id = rb.asset_a_id 
          AND rh_a.evaluation_module_id = $1
          AND rh_a.created_timestamp <= rb.completed_at
        )
        LEFT JOIN "${appId}_evaluation_rating_history" rh_b ON (
          rh_b.asset_id = rb.asset_b_id 
          AND rh_b.evaluation_module_id = $1
          AND rh_b.created_timestamp <= rb.completed_at
        )
      )
      SELECT DISTINCT ON (asset_a_id, asset_b_id, completed_at)
        asset_a_id,
        asset_b_id,
        result,
        completed_at,
        rating_a,
        rating_b,
        rn
      FROM battle_ratings
      WHERE rating_a IS NOT NULL AND rating_b IS NOT NULL
      ORDER BY asset_a_id, asset_b_id, completed_at, rn;
    `,
      [moduleId],
    );

    if (recentBattlesWithRatings.length < 10) {
      return {
        averageSurprise: 0.5,
        isDiminishing: false,
        recentQualityScore: 0.5,
      };
    }

    // 向量化计算意外程度
    const surpriseScores = recentBattlesWithRatings.slice(0, 20).map((battle: any) => {
      const ratingDiff = battle.rating_a - battle.rating_b;
      const expectedWinProbA = 1 / (1 + Math.pow(10, -ratingDiff / 400));

      let actualResult: number;
      if (battle.result === 'A_WIN') actualResult = 1;
      else if (battle.result === 'B_WIN') actualResult = 0;
      else actualResult = 0.5;

      return Math.abs(actualResult - expectedWinProbA);
    });

    const averageSurprise = surpriseScores.reduce((a, b) => a + b, 0) / surpriseScores.length;

    // 比较最近10场和之前10场的质量
    const recent10 = surpriseScores.slice(0, 10);
    const previous10 = surpriseScores.slice(10, 20);

    const recentAvg = recent10.reduce((a, b) => a + b, 0) / recent10.length;
    const previousAvg = previous10.reduce((a, b) => a + b, 0) / previous10.length;

    const isDiminishing = recentAvg < previousAvg * 0.8;

    return {
      averageSurprise,
      isDiminishing,
      recentQualityScore: recentAvg,
    };
  }

  /**
   * Kendall's Tau算法：计算两个排名的相似度
   */
  private calculateRankingSimilarity(ranking1: string[], ranking2: string[]): number {
    if (ranking1.length === 0 || ranking2.length === 0) return 0;

    const commonAssets = _.intersection(ranking1, ranking2);
    if (commonAssets.length < 2) return 0;

    let concordant = 0;
    let discordant = 0;

    for (let i = 0; i < commonAssets.length; i++) {
      for (let j = i + 1; j < commonAssets.length; j++) {
        const asset1 = commonAssets[i];
        const asset2 = commonAssets[j];

        const rank1_1 = ranking1.indexOf(asset1);
        const rank1_2 = ranking1.indexOf(asset2);
        const rank2_1 = ranking2.indexOf(asset1);
        const rank2_2 = ranking2.indexOf(asset2);

        if (rank1_1 === -1 || rank1_2 === -1 || rank2_1 === -1 || rank2_2 === -1) {
          continue;
        }

        const order1 = rank1_1 - rank1_2;
        const order2 = rank2_1 - rank2_2;

        if (order1 * order2 > 0) {
          concordant++;
        } else if (order1 * order2 < 0) {
          discordant++;
        }
      }
    }

    const totalPairs = concordant + discordant;
    if (totalPairs === 0) return 1;

    const tau = (concordant - discordant) / totalPairs;
    return (tau + 1) / 2;
  }

  /**
   * 分析趋势方向
   */
  private analyzeTrendDirection(recentPoints: Array<{ time: number; avgSigma: number }>): 'improving' | 'stable' | 'degrading' {
    if (recentPoints.length < 3) return 'stable';

    const changes = [];
    for (let i = 1; i < recentPoints.length; i++) {
      changes.push(recentPoints[i].avgSigma - recentPoints[i - 1].avgSigma);
    }

    const avgChange = changes.reduce((a, b) => a + b, 0) / changes.length;

    if (avgChange < -0.1) return 'improving';
    if (avgChange > 0.1) return 'degrading';
    return 'stable';
  }

  /**
   * 综合决策
   */
  private makeConvergenceDecision(
    rankingStability: RankingStabilityResult,
    trendAnalysis: TrendAnalysisResult,
    qualityAnalysis: QualityAnalysisResult,
    assetCount?: number,
    totalBattles?: number,
    avgSigma?: number,
  ): ConvergenceResult {
    let shouldStop = false;
    let reason = '';
    let confidence = 0;

    if (assetCount && totalBattles && avgSigma !== undefined) {
      const battlesPerAsset = totalBattles / assetCount;
      const hardLimit = assetCount * 6;
      const softLimit = assetCount * 3;

      if (totalBattles >= hardLimit) {
        shouldStop = true;
        confidence = 0.8;
        reason = `Hard efficiency limit: ${totalBattles} battles (${battlesPerAsset.toFixed(1)} per asset)`;
      } else if (totalBattles >= softLimit && avgSigma < 7.5) {
        shouldStop = true;
        confidence = 0.7;
        reason = `Soft efficiency limit with reasonable sigma: ${avgSigma.toFixed(2)} (${battlesPerAsset.toFixed(1)} per asset)`;
      } else if (avgSigma < 7.0 && battlesPerAsset >= 2.0) {
        shouldStop = true;
        confidence = 0.6;
        reason = `Sigma convergence: avgSigma=${avgSigma.toFixed(2)}, ${battlesPerAsset.toFixed(1)} battles per asset`;
      }
    }

    if (!shouldStop) {
      if (rankingStability.stabilityScore > 0.4 && rankingStability.consecutiveStableWindows >= 1) {
        shouldStop = true;
        reason = `Relaxed ranking stability: ${(rankingStability.stabilityScore * 100).toFixed(1)}% stability, ${rankingStability.consecutiveStableWindows} stable windows`;
        confidence = 0.6;
      } else if (qualityAnalysis.isDiminishing && rankingStability.stabilityScore > 0.3) {
        shouldStop = true;
        reason = 'Information gain diminishing with minimal stability';
        confidence = 0.5;
      } else if (trendAnalysis.isConverging && trendAnalysis.recentTrend === 'improving' && rankingStability.stabilityScore > 0.3) {
        shouldStop = true;
        reason = 'Sigma convergence with improving trend and minimal stability';
        confidence = 0.5;
      } else if (rankingStability.stabilityScore > 0.7 && rankingStability.windowAnalysis.length >= 2) {
        shouldStop = true;
        reason = 'Good ranking stability detected';
        confidence = 0.6;
      }
    }

    if (!shouldStop) {
      reason =
        `Continuing evaluation: stability=${(rankingStability.stabilityScore * 100).toFixed(1)}%, ` +
        `consecutive=${rankingStability.consecutiveStableWindows}, ` +
        `trend=${trendAnalysis.recentTrend}`;

      if (rankingStability.windowAnalysis.length >= 3) {
        confidence = Math.min(0.8, 0.3 + rankingStability.stabilityScore * 0.5);
      } else if (rankingStability.windowAnalysis.length >= 1) {
        confidence = 0.6;
      } else {
        confidence = 0.7;
      }
    }

    return {
      shouldStop,
      reason,
      confidence,
      details: {
        rankingStability,
        trendAnalysis,
        qualityAnalysis,
      },
    };
  }

  // 辅助方法
  private async getTotalBattles(moduleId: string): Promise<number> {
    return await this.battleRepository.createQueryBuilder('battle').where('battle.evaluationModuleId = :moduleId', { moduleId }).andWhere('battle.result IS NOT NULL').getCount();
  }

  private getDefaultConvergenceResult(): ConvergenceResult {
    return {
      shouldStop: false,
      reason: 'Error in convergence detection',
      confidence: 0,
      details: {
        rankingStability: { isStable: false, stabilityScore: 0, consecutiveStableWindows: 0, windowAnalysis: [] },
        trendAnalysis: { sigmaConvergenceRate: 0, predictedConvergenceBattles: 0, isConverging: false, recentTrend: 'stable' },
        qualityAnalysis: { averageSurprise: 0, isDiminishing: false, recentQualityScore: 0 },
      },
    };
  }

  /**
   * 实用收敛检测逻辑（< 500 资产）
   * 针对小中规模样本使用简单有效的标准，避免过度对战
   */
  private async handlePracticalEvaluation(moduleId: string, currentRankings: Array<{ assetId: string; rating: any }>): Promise<ConvergenceResult> {
    const assetCount = currentRankings.length;
    const totalBattles = await this.getTotalBattles(moduleId);

    // 根据资产数量设定不同的收敛标准
    let targetSigma: number;
    let minBattlesPerAsset: number;

    if (assetCount < 50) {
      // 小样本：更严格
      targetSigma = 7.0;
      minBattlesPerAsset = 5;
    } else if (assetCount < 200) {
      // 中样本：平衡
      targetSigma = 6.5;
      minBattlesPerAsset = 4;
    } else {
      // 大样本：更宽松，注重效率
      targetSigma = 6.0;
      minBattlesPerAsset = 3;
    }

    // 标准1：平均sigma检查
    const avgSigma = currentRankings.reduce((sum, r) => sum + r.rating.sigma, 0) / assetCount;
    const sigmaConverged = avgSigma < targetSigma;

    // 标准2：最少对战次数检查
    const minBattles = Math.min(...currentRankings.map((r) => r.rating.totalBattles));
    const minBattlesReached = minBattles >= minBattlesPerAsset;

    // 标准3：总对战数合理性检查（防止无限对战）
    const expectedMaxBattles = assetCount * (minBattlesPerAsset + 2); // 允许一定冗余
    const reasonableBattleCount = totalBattles <= expectedMaxBattles;

    let shouldStop = false;
    let confidence = 0;
    let reason = '';

    if (sigmaConverged && minBattlesReached) {
      shouldStop = true;
      confidence = 0.9;
      reason = `Practical convergence: avgSigma=${avgSigma.toFixed(2)}<${targetSigma}, minBattles=${minBattles}≥${minBattlesPerAsset}`;
    } else if (!reasonableBattleCount) {
      // 安全退出：总对战数过多
      shouldStop = true;
      confidence = 0.8;
      reason = `Efficiency exit: ${totalBattles} battles exceeds expected ${expectedMaxBattles} (${(totalBattles / assetCount).toFixed(1)} per asset)`;
    } else {
      const issues = [];
      if (!sigmaConverged) issues.push(`avgSigma=${avgSigma.toFixed(2)}≥${targetSigma}`);
      if (!minBattlesReached) issues.push(`minBattles=${minBattles}<${minBattlesPerAsset}`);

      reason = `Practical continuing: ${issues.join(', ')}`;
      confidence = 0.8;
    }

    return {
      shouldStop,
      reason,
      confidence,
      details: {
        rankingStability: {
          isStable: shouldStop,
          stabilityScore: sigmaConverged ? 0.9 : 0.5,
          consecutiveStableWindows: shouldStop ? 5 : 0,
          windowAnalysis: [],
        },
        trendAnalysis: {
          sigmaConvergenceRate: sigmaConverged ? 1 : 0,
          predictedConvergenceBattles: shouldStop ? 0 : expectedMaxBattles - totalBattles,
          isConverging: avgSigma < 8,
          recentTrend: avgSigma < targetSigma ? 'improving' : 'stable',
        },
        qualityAnalysis: {
          averageSurprise: 0.4,
          isDiminishing: minBattlesReached,
          recentQualityScore: minBattlesReached ? 0.8 : 0.5,
        },
      },
    };
  }
}
