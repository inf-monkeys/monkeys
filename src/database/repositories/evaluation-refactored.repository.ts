import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository, SelectQueryBuilder } from 'typeorm';
import { BattleGroupEntity } from '../entities/evaluation/battle-group.entity';
import { EvaluationBattleEntity } from '../entities/evaluation/evaluation-battle.entity';
import { EvaluationModuleEntity } from '../entities/evaluation/evaluation-module.entity';
import { EvaluationRatingHistoryEntity } from '../entities/evaluation/evaluation-rating-history.entity';
import { EvaluatorEntity } from '../entities/evaluation/evaluator.entity';
import { LeaderboardScoreEntity } from '../entities/evaluation/leaderboard-score.entity';
import { LeaderboardEntity } from '../entities/evaluation/leaderboard.entity';
import { ModuleEvaluatorEntity } from '../entities/evaluation/module-evaluator.entity';

@Injectable()
export class EvaluationRefactoredRepository {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(EvaluationModuleEntity)
    private readonly evaluationModuleRepository: Repository<EvaluationModuleEntity>,
    @InjectRepository(EvaluatorEntity)
    private readonly evaluatorRepository: Repository<EvaluatorEntity>,
    @InjectRepository(ModuleEvaluatorEntity)
    private readonly moduleEvaluatorRepository: Repository<ModuleEvaluatorEntity>,
    @InjectRepository(LeaderboardEntity)
    private readonly leaderboardRepository: Repository<LeaderboardEntity>,
    @InjectRepository(LeaderboardScoreEntity)
    private readonly scoreRepository: Repository<LeaderboardScoreEntity>,
    @InjectRepository(EvaluationBattleEntity)
    private readonly battleRepository: Repository<EvaluationBattleEntity>,
    @InjectRepository(BattleGroupEntity)
    private readonly battleGroupRepository: Repository<BattleGroupEntity>,
    @InjectRepository(EvaluationRatingHistoryEntity)
    private readonly ratingHistoryRepository: Repository<EvaluationRatingHistoryEntity>,
  ) {}

  // ============ 使用 TypeORM QueryBuilder 重构的方法 ============

  /**
   * 获取排行榜数据带对战统计 - 使用 TypeORM QueryBuilder
   */
  public async getLeaderboardScoresWithBattleStats(
    evaluationModuleId: string,
    evaluatorId?: string,
    page: number = 1,
    limit: number = 10,
    sortBy?: string,
    sortOrder?: 'ASC' | 'DESC',
    minBattles?: number,
    search?: string,
  ): Promise<any[]> {
    return this.dataSource.transaction(async (manager) => {
      // 构建对战统计子查询
      const battleStatsSubQuery = this.createBattleStatsSubQuery(manager, evaluationModuleId);

      // 主查询
      let mainQuery = manager
        .createQueryBuilder(LeaderboardScoreEntity, 'score')
        .leftJoin(`(${battleStatsSubQuery.getQuery()})`, 'battle_stats', 'score.assetId = battle_stats.asset_id')
        .select([
          'score.id as "id"',
          'score.assetId as "assetId"',
          'score.evaluationModuleId as "evaluationModuleId"',
          'score.gamesPlayed as "gamesPlayed"',
          'score.createdTimestamp as "createdTimestamp"',
          'score.updatedTimestamp as "updatedTimestamp"',
          'COALESCE(battle_stats.total_battles, 0) as "totalBattles"',
          'COALESCE(battle_stats.wins, 0) as "wins"',
          'COALESCE(battle_stats.losses, 0) as "losses"',
          'COALESCE(battle_stats.draws, 0) as "draws"',
        ])
        .where('score.evaluationModuleId = :moduleId', { moduleId: evaluationModuleId });

      // 动态添加条件
      if (minBattles && minBattles > 0) {
        mainQuery = mainQuery.andWhere('COALESCE(battle_stats.total_battles, 0) >= :minBattles', {
          minBattles,
        });
      }

      if (search) {
        mainQuery = mainQuery.andWhere('score.assetId LIKE :search', { search: `%${search}%` });
      }

      // 动态排序
      this.applySorting(mainQuery, sortBy, sortOrder);

      // 设置参数并执行
      return mainQuery
        .setParameters(battleStatsSubQuery.getParameters())
        .skip((page - 1) * limit)
        .take(limit)
        .getRawMany();
    });
  }

  /**
   * 计算排行榜总数 - 使用 TypeORM QueryBuilder
   */
  public async countLeaderboardScores(evaluationModuleId: string, evaluatorId?: string, minBattles?: number, search?: string): Promise<number> {
    return this.dataSource.transaction(async (manager) => {
      let query = manager.createQueryBuilder(LeaderboardScoreEntity, 'score').where('score.evaluationModuleId = :moduleId', { moduleId: evaluationModuleId });

      if (search) {
        query = query.andWhere('score.assetId LIKE :search', { search: `%${search}%` });
      }

      if (minBattles && minBattles > 0) {
        const battleStatsSubQuery = this.createBattleStatsSubQuery(manager, evaluationModuleId);
        query = query
          .leftJoin(`(${battleStatsSubQuery.getQuery()})`, 'battle_stats', 'score.assetId = battle_stats.asset_id')
          .andWhere('COALESCE(battle_stats.total_battles, 0) >= :minBattles', { minBattles })
          .setParameters(battleStatsSubQuery.getParameters());
      }

      return query.getCount();
    });
  }

  /**
   * 获取排行榜统计信息 - 使用 TypeORM QueryBuilder
   */
  public async getLeaderboardStats(
    evaluationModuleId: string,
    evaluatorId?: string,
  ): Promise<{
    totalParticipants: number;
    totalBattles: number;
    averageRating: number;
    highestRating: number;
    lowestRating: number;
    mostActiveBattler: { assetId: string; assetName: string; battleCount: number };
    lastUpdated: Date;
  }> {
    return this.dataSource.transaction(async (manager) => {
      // 获取总参与者数量
      const totalParticipants = await this.countLeaderboardScores(evaluationModuleId, evaluatorId);

      // 获取总对战数
      const totalBattles = await this.countModuleBattles(evaluationModuleId);

      // 如果未指定 evaluatorId，则查找第一个活跃的评测员作为默认
      // 获取评分统计
      // TODO: 评分统计现在由 OpenSkillService 处理，这里暂时返回默认值
      const ratingStats: { avgRating: string; maxRating: string; minRating: string } = { avgRating: '1500', maxRating: '1500', minRating: '1500' };

      // 获取最活跃的对战者
      const battleTableName = manager.getRepository(EvaluationBattleEntity).metadata.tableName;
      const mostActiveQuery = manager
        .createQueryBuilder()
        .select(['combined.asset_id as "assetId"', 'SUM(combined.battle_count) as "battleCount"', 'CONCAT(\'Asset \', combined.asset_id) as "assetName"'])
        .from(
          `(
              SELECT battle.asset_a_id as asset_id, COUNT(*) as battle_count
              FROM ${battleTableName} battle
              WHERE battle.evaluation_module_id = :moduleId AND battle.result IS NOT NULL
              GROUP BY battle.asset_a_id
              UNION ALL
              SELECT battle.asset_b_id as asset_id, COUNT(*) as battle_count
              FROM ${battleTableName} battle
              WHERE battle.evaluation_module_id = :moduleId AND battle.result IS NOT NULL
              GROUP BY battle.asset_b_id
            )`,
          'combined',
        )
        .groupBy('combined.asset_id')
        .orderBy('SUM(combined.battle_count)', 'DESC')
        .setParameter('moduleId', evaluationModuleId)
        .limit(1);

      const mostActive = await mostActiveQuery.getRawOne();

      // 获取最后更新时间
      const lastUpdatedQuery = await manager
        .createQueryBuilder(LeaderboardScoreEntity, 'score')
        .select('MAX(score.updatedTimestamp)', 'lastUpdated')
        .where('score.evaluationModuleId = :moduleId', { moduleId: evaluationModuleId })
        .getRawOne();

      return {
        totalParticipants,
        totalBattles,
        averageRating: parseFloat(ratingStats?.avgRating || '1500'),
        highestRating: parseFloat(ratingStats?.maxRating || '1500'),
        lowestRating: parseFloat(ratingStats?.minRating || '1500'),
        mostActiveBattler: mostActive
          ? {
              assetId: mostActive.assetId,
              assetName: mostActive.assetName,
              battleCount: parseInt(mostActive.battleCount),
            }
          : { assetId: '', assetName: 'N/A', battleCount: 0 },
        lastUpdated: lastUpdatedQuery?.lastUpdated || new Date(),
      };
    });
  }

  /**
   * 获取最近对战记录 - 使用 TypeORM QueryBuilder
   */
  public async getRecentBattlesWithRatingChanges(moduleId: string, since: Date, limit: number = 50): Promise<EvaluationBattleEntity[]> {
    return this.battleRepository
      .createQueryBuilder('battle')
      .leftJoinAndSelect('battle.evaluator', 'evaluator')
      .where('battle.evaluationModuleId = :moduleId', { moduleId })
      .andWhere('battle.result IS NOT NULL')
      .andWhere('battle.completedAt IS NOT NULL')
      .andWhere('battle.completedAt >= :since', { since })
      .orderBy('battle.completedAt', 'DESC')
      .limit(limit)
      .getMany();
  }

  /**
   * 获取资产评分历史 - 使用 TypeORM QueryBuilder
   */
  public async getAssetRatingHistory(assetId: string, moduleId: string, evaluatorId?: string, limit: number = 50): Promise<EvaluationBattleEntity[]> {
    let query = this.battleRepository
      .createQueryBuilder('battle')
      .leftJoinAndSelect('battle.evaluator', 'evaluator')
      .where('battle.evaluationModuleId = :moduleId', { moduleId })
      .andWhere('(battle.assetAId = :assetId OR battle.assetBId = :assetId)', { assetId })
      .andWhere('battle.result IS NOT NULL')
      .andWhere('battle.completedAt IS NOT NULL')
      .orderBy('battle.completedAt', 'DESC')
      .limit(limit);

    if (evaluatorId) {
      query = query.andWhere('battle.evaluatorId = :evaluatorId', { evaluatorId });
    }

    return query.getMany();
  }

  /**
   * 计算模块总对战数 - 使用 TypeORM QueryBuilder
   */
  public async countModuleBattles(evaluationModuleId: string): Promise<number> {
    return this.battleRepository.createQueryBuilder('battle').where('battle.evaluationModuleId = :evaluationModuleId', { evaluationModuleId }).andWhere('battle.result IS NOT NULL').getCount();
  }

  /**
   * 保存对战和评分 - 完善的事务处理
   */
  public async saveBattleAndScores(battleToUpdate: EvaluationBattleEntity, scoresToUpdate: LeaderboardScoreEntity[], manager?: EntityManager): Promise<void> {
    if (manager) {
      // 使用现有的事务管理器
      try {
        // 先保存对战结果
        await manager.save(EvaluationBattleEntity, battleToUpdate);

        // 然后保存评分更新
        await manager.save(LeaderboardScoreEntity, scoresToUpdate);

        // 可以在这里添加额外的业务逻辑验证
        await this.validateBattleAndScores(manager, battleToUpdate, scoresToUpdate);
      } catch (error) {
        throw new Error(`Failed to save battle and scores: ${error.message}`);
      }
    } else {
      // 创建新的事务
      return this.dataSource.transaction(async (transactionManager) => {
        try {
          // 先保存对战结果
          await transactionManager.save(EvaluationBattleEntity, battleToUpdate);

          // 然后保存评分更新
          await transactionManager.save(LeaderboardScoreEntity, scoresToUpdate);

          // 可以在这里添加额外的业务逻辑验证
          await this.validateBattleAndScores(transactionManager, battleToUpdate, scoresToUpdate);
        } catch (error) {
          // 事务会自动回滚
          throw new Error(`Failed to save battle and scores: ${error.message}`);
        }
      });
    }
  }

  // ============ 私有辅助方法 ============

  /**
   * 创建对战统计子查询
   */
  private createBattleStatsSubQuery(manager: EntityManager, evaluationModuleId: string): SelectQueryBuilder<any> {
    const battleTableName = manager.getRepository(EvaluationBattleEntity).metadata.tableName;
    const subQuery = `(
        SELECT battle.asset_a_id as asset_id,
               SUM(CASE WHEN battle.result = 'A_WIN' THEN 1 ELSE 0 END) as wins,
               SUM(CASE WHEN battle.result = 'B_WIN' THEN 1 ELSE 0 END) as losses,
               SUM(CASE WHEN battle.result = 'DRAW' THEN 1 ELSE 0 END) as draws
        FROM ${battleTableName} battle
        WHERE battle.evaluation_module_id = :moduleId AND battle.result IS NOT NULL
        GROUP BY battle.asset_a_id
        UNION ALL
        SELECT battle.asset_b_id as asset_id,
               SUM(CASE WHEN battle.result = 'B_WIN' THEN 1 ELSE 0 END) as wins,
               SUM(CASE WHEN battle.result = 'A_WIN' THEN 1 ELSE 0 END) as losses,
               SUM(CASE WHEN battle.result = 'DRAW' THEN 1 ELSE 0 END) as draws
        FROM ${battleTableName} battle
        WHERE battle.evaluation_module_id = :moduleId AND battle.result IS NOT NULL
        GROUP BY battle.asset_b_id
      )`;

    return manager
      .createQueryBuilder()
      .select([
        'combined_stats.asset_id as asset_id',
        '(SUM(combined_stats.wins) + SUM(combined_stats.losses) + SUM(combined_stats.draws))::int as total_battles',
        'SUM(combined_stats.wins)::int as wins',
        'SUM(combined_stats.losses)::int as losses',
        'SUM(combined_stats.draws)::int as draws',
      ])
      .from(subQuery, 'combined_stats')
      .groupBy('combined_stats.asset_id')
      .setParameter('moduleId', evaluationModuleId);
  }

  /**
   * 应用排序逻辑
   */
  private applySorting(query: SelectQueryBuilder<any>, sortBy?: string, sortOrder?: 'ASC' | 'DESC'): void {
    const direction = sortOrder || 'DESC';

    if (sortBy) {
      switch (sortBy) {
        case 'rating':
          // TODO: 默认排序改为按胜场排序
          query.orderBy('COALESCE(battle_stats.wins, 0)', direction);
          break;
        case 'battles':
          query.orderBy('COALESCE(battle_stats.total_battles, 0)', direction);
          break;
        case 'wins':
          query.orderBy('COALESCE(battle_stats.wins, 0)', direction);
          break;
        case 'winRate':
          query.orderBy('CASE WHEN COALESCE(battle_stats.total_battles, 0) > 0 THEN CAST(COALESCE(battle_stats.wins, 0) AS FLOAT) / COALESCE(battle_stats.total_battles, 1) ELSE 0 END', direction);
          break;
        default:
          query.orderBy('score.createdTimestamp', 'DESC');
      }
    } else {
      // 默认排序
      query.orderBy('score.createdTimestamp', 'DESC');
    }
  }

  /**
   * 验证对战和评分数据的一致性
   */
  private async validateBattleAndScores(_manager: EntityManager, battle: EvaluationBattleEntity, scores: LeaderboardScoreEntity[]): Promise<void> {
    // 验证对战结果必须存在
    if (!battle.result) {
      throw new Error('Battle result is required');
    }

    // 验证评分更新必须包含对战双方
    const scoreAssetIds = new Set(scores.map((s) => s.assetId));

    if (!scoreAssetIds.has(battle.assetAId) || !scoreAssetIds.has(battle.assetBId)) {
      throw new Error('Score updates must include both battle participants');
    }

    // 验证评分变化是否合理
    for (const score of scores) {
      if (score.gamesPlayed < 0) {
        throw new Error(`Invalid games played count for asset ${score.assetId}`);
      }
    }
  }

  public async getAggregatedRatingTrends(moduleId: string, since: Date): Promise<any[]> {
    return this.ratingHistoryRepository
      .createQueryBuilder('history')
      .select(['history.assetId as "assetId"', 'history.ratingAfter as "rating"', 'battle.completedAt as "date"'])
      .innerJoin(EvaluationBattleEntity, 'battle', 'battle.id = history.battleId')
      .where('history.evaluationModuleId = :moduleId', { moduleId })
      .andWhere('battle.completedAt >= :since', { since })
      .orderBy('battle.completedAt', 'ASC')
      .getRawMany();
  }

  public async getRatingHistoryForAsset(assetId: string, moduleId: string, limit: number = 50): Promise<any[]> {
    return this.ratingHistoryRepository
      .createQueryBuilder('history')
      .select([
        'history.battleId as "battleId"',
        'history.ratingBefore as "oldRating"',
        'history.ratingAfter as "newRating"',
        'history.ratingChange as "change"',
        'battle.completedAt as "date"',
        'battle.result as "result"',
        'evaluator.name as "evaluatorName"',
        'CASE WHEN battle.assetAId = :assetId THEN battle.assetBId ELSE battle.assetAId END as "opponentId"',
      ])
      .innerJoin(EvaluationBattleEntity, 'battle', 'battle.id = history.battleId')
      .leftJoin(EvaluatorEntity, 'evaluator', 'evaluator.id = battle.evaluatorId')
      .where('history.evaluationModuleId = :moduleId', { moduleId })
      .andWhere('history.assetId = :assetId', { assetId })
      .orderBy('battle.completedAt', 'DESC')
      .limit(limit)
      .getRawMany();
  }
}
