import { config } from '@/common/config';
import { generateDbId } from '@/common/utils';
import { BattleGroupEntity, BattleGroupStatus, BattleStrategy } from '@/database/entities/evaluation/battle-group.entity';
import { BattleResult, EvaluationBattleEntity } from '@/database/entities/evaluation/evaluation-battle.entity';
import { DEFAULT_GLICKO_CONFIG, EvaluationModuleEntity, GlickoConfig } from '@/database/entities/evaluation/evaluation-module.entity';
import { EvaluatorEntity, EvaluatorType } from '@/database/entities/evaluation/evaluator.entity';
import { LeaderboardScoreEntity } from '@/database/entities/evaluation/leaderboard-score.entity';
import { LeaderboardEntity } from '@/database/entities/evaluation/leaderboard.entity';
import { ModuleEvaluatorEntity } from '@/database/entities/evaluation/module-evaluator.entity';
import { EvaluationRefactoredRepository } from '@/database/repositories/evaluation-refactored.repository';
import { EvaluationRepository } from '@/database/repositories/evaluation.repository';
import { MediaFileService } from '@/modules/assets/media/media.service';
import { LlmService } from '@/modules/tools/llm/llm.service';
import { Injectable, Logger } from '@nestjs/common';
import { Glicko2, Player } from 'glicko2';
import { isObject } from 'lodash';
import { DataSource, EntityManager } from 'typeorm';
import { BattleStrategyService } from './battle-strategy.service';

// 定义一个不会与数据库ID冲突的特殊字符串作为虚拟评测员的ID
export const VIRTUAL_LLM_EVALUATOR_ID = 'default-llm-evaluator';

// 统一的错误消息
export const ERROR_MESSAGES = {
  EVALUATION_MODULE_NOT_FOUND: 'Evaluation module not found',
  EVALUATOR_NOT_FOUND: 'Evaluator not found',
  BATTLE_NOT_FOUND: 'Battle not found',
  BATTLE_GROUP_NOT_FOUND: 'Battle group not found',
  MEDIA_FILE_NOT_FOUND: 'One or both media files not found',
  INVALID_TEAM_ACCESS: 'Media files must belong to the same team as evaluation module',
  SAME_ASSET_BATTLE: 'Cannot create battle with the same asset',
  EVALUATOR_ALREADY_ASSOCIATED: 'Evaluator is already associated with this module',
  INVALID_MEDIA_FILES: 'Some media files not found or belong to different team',
  NO_LLM_EVALUATORS: 'No active LLM evaluators found for this module',
} as const;

export const BASE_EVALUATION_TEMPLATE = `Compare these two images and determine which one is better based on the specific criteria provided.

Evaluation Focus: {EVALUATION_FOCUS}

Consider:
- Technical quality (clarity, lighting, colors)
- Composition and aesthetics  
- Visual appeal
- The specific evaluation focus mentioned above

Rules:
1. Output ONLY a JSON object
2. Use "A" for first image, "B" for second image, "draw" for equal quality
3. No explanations or additional text

Format: {"winner": "A"}`;

export const DEFAULT_EVALUATION_FOCUS = 'overall image quality and aesthetic appeal';

export interface CreateEvaluationModuleDto {
  displayName: string;
  description?: string;
  evaluationCriteria?: string;
  participantAssetIds?: string[];
  glickoConfig?: GlickoConfig;
}

export interface CreateEvaluatorDto {
  name: string;
  type: EvaluatorType;
  llmModelName?: string;
  evaluationFocus?: string;
  humanUserId?: string;
  config?: Record<string, any>;
}

@Injectable()
export class EvaluationService {
  private readonly logger = new Logger(EvaluationService.name);
  constructor(
    private readonly evaluationRepository: EvaluationRepository,
    private readonly evaluationRefactoredRepository: EvaluationRefactoredRepository,
    private readonly dataSource: DataSource,
    private readonly llmService: LlmService,
    private readonly mediaFileService: MediaFileService,
    private readonly battleStrategyService: BattleStrategyService,
  ) {}

  private buildEvaluationPrompt(evaluationFocus: string): string {
    return BASE_EVALUATION_TEMPLATE.replace('{EVALUATION_FOCUS}', evaluationFocus.trim());
  }

  /**
   * 验证单个对战的媒体文件有效性
   */
  private async validateBattleAssets(assetAId: string, assetBId: string, teamId: string): Promise<{ mediaA: any; mediaB: any }> {
    const [mediaA, mediaB] = await Promise.all([this.mediaFileService.getMediaById(assetAId), this.mediaFileService.getMediaById(assetBId)]);

    if (!mediaA || !mediaB) {
      throw new Error(ERROR_MESSAGES.MEDIA_FILE_NOT_FOUND);
    }

    if (mediaA.teamId !== teamId || mediaB.teamId !== teamId) {
      throw new Error(ERROR_MESSAGES.INVALID_TEAM_ACCESS);
    }

    return { mediaA, mediaB };
  }

  /**
   * 验证批量资产的有效性
   */
  private async validateBatchAssets(assetIds: string[], teamId: string): Promise<void> {
    const mediaFiles = await Promise.all(assetIds.map((id) => this.mediaFileService.getMediaById(id)));
    const invalidMedia = mediaFiles.some((media) => !media || media.teamId !== teamId);

    if (invalidMedia) {
      throw new Error(ERROR_MESSAGES.INVALID_MEDIA_FILES);
    }
  }

  /**
   * 按需创建默认的LLM评测员
   * 如果传入的 evaluatorId 是虚拟ID，则创建实体并返回新的真实ID
   * 否则直接返回传入的ID
   */
  private async getOrCreateDefaultLlmEvaluator(moduleId: string, evaluatorId: string): Promise<string> {
    if (evaluatorId !== VIRTUAL_LLM_EVALUATOR_ID) {
      return evaluatorId;
    }

    this.logger.log(`Lazily creating default LLM evaluator for module ${moduleId}`);

    const module = await this.getEvaluationModule(moduleId);
    if (!module) {
      throw new Error(ERROR_MESSAGES.EVALUATION_MODULE_NOT_FOUND);
    }

    // 使用 createEvaluator 创建真实的评测员实体
    const realEvaluator = await this.createEvaluator({
      name: '默认LLM评测员',
      type: EvaluatorType.LLM,
    });

    // 将新创建的评测员关联到当前模块
    await this.addEvaluatorToModule(moduleId, realEvaluator.id);

    // 返回新创建的真实ID
    return realEvaluator.id;
  }

  public async createEvaluationModule(teamId: string, userId: string, createDto: CreateEvaluationModuleDto): Promise<EvaluationModuleEntity> {
    return this.dataSource.transaction(async (manager) => {
      const leaderboard = manager.create(LeaderboardEntity, {
        id: generateDbId(),
      });
      const savedLeaderboard = await manager.save(leaderboard);

      const evaluationModule = manager.create(EvaluationModuleEntity, {
        id: generateDbId(),
        teamId: teamId,
        creatorUserId: userId,
        displayName: isObject(createDto.displayName) ? JSON.stringify(createDto.displayName) : createDto.displayName,
        description: isObject(createDto.description) ? JSON.stringify(createDto.description) : createDto.description,
        leaderboardId: savedLeaderboard.id,
        evaluationCriteria: createDto.evaluationCriteria,
        glickoConfig: createDto.glickoConfig || DEFAULT_GLICKO_CONFIG,
        participantAssetIds: createDto.participantAssetIds || [],
      });

      return manager.save(evaluationModule);
    });
  }

  public async createEvaluator(createDto: CreateEvaluatorDto): Promise<EvaluatorEntity> {
    const evaluator = new EvaluatorEntity();
    evaluator.id = generateDbId();
    evaluator.name = createDto.name;
    evaluator.type = createDto.type;
    evaluator.config = createDto.config || {};

    if (createDto.type === EvaluatorType.LLM) {
      evaluator.llmModelName = createDto.llmModelName || config.evaluation.defaultLlmEvaluatorModel;
      evaluator.evaluationFocus = createDto.evaluationFocus || DEFAULT_EVALUATION_FOCUS;
    } else {
      evaluator.humanUserId = createDto.humanUserId;
    }

    return this.evaluationRepository.saveEvaluator(evaluator);
  }

  public async listEvaluators(page: number = 1, limit: number = 10, search?: string): Promise<{ list: EvaluatorEntity[]; totalCount: number }> {
    return this.evaluationRepository.listEvaluators(page, limit, search);
  }

  public async getEvaluator(evaluatorId: string): Promise<EvaluatorEntity | null> {
    return this.evaluationRepository.findEvaluatorById(evaluatorId);
  }

  public async getEvaluatorsByModule(evaluationModuleId: string, page: number = 1, limit: number = 10): Promise<{ list: EvaluatorEntity[]; totalCount: number }> {
    // 直接调用 Repository 中已经存在的公共方法
    const { list, totalCount } = await this.evaluationRepository.getEvaluatorsByModule(evaluationModuleId, page, limit);

    // 如果是第一页且没有查询到任何LLM类型的评测员，则动态添加一个虚拟的默认评测员
    const hasLlmEvaluator = list.some((e) => e.type === EvaluatorType.LLM);
    if (page === 1 && !hasLlmEvaluator) {
      const defaultEvaluator = new EvaluatorEntity();
      defaultEvaluator.id = VIRTUAL_LLM_EVALUATOR_ID;
      defaultEvaluator.name = '默认LLM评测员 (自动创建)';
      defaultEvaluator.type = EvaluatorType.LLM;
      defaultEvaluator.llmModelName = config.evaluation.defaultLlmEvaluatorModel;
      defaultEvaluator.evaluationFocus = DEFAULT_EVALUATION_FOCUS;

      // 将默认评测员插入到列表的开头
      list.unshift(defaultEvaluator);
      return { list, totalCount: totalCount + 1 };
    }

    return { list, totalCount };
  }

  public async addEvaluatorToModule(evaluationModuleId: string, evaluatorId: string, weight: number = 1.0): Promise<ModuleEvaluatorEntity> {
    return this.dataSource.transaction(async (manager) => {
      const [module, evaluator] = await Promise.all([
        this.evaluationRepository.findEvaluationModuleById(evaluationModuleId, manager),
        this.evaluationRepository.findEvaluatorById(evaluatorId, manager),
      ]);

      if (!module) throw new Error(ERROR_MESSAGES.EVALUATION_MODULE_NOT_FOUND);
      if (!evaluator) throw new Error(ERROR_MESSAGES.EVALUATOR_NOT_FOUND);

      // 检查是否已存在相同的评测员关联
      const existingAssociation = await manager
        .createQueryBuilder(ModuleEvaluatorEntity, 'me')
        .where('me.evaluationModuleId = :moduleId', { moduleId: evaluationModuleId })
        .andWhere('me.evaluatorId = :evaluatorId', { evaluatorId })
        .getOne();

      if (existingAssociation) {
        throw new Error(ERROR_MESSAGES.EVALUATOR_ALREADY_ASSOCIATED);
      }

      const moduleEvaluator = new ModuleEvaluatorEntity();
      moduleEvaluator.id = generateDbId();
      moduleEvaluator.evaluationModuleId = evaluationModuleId;
      moduleEvaluator.evaluatorId = evaluatorId;
      moduleEvaluator.weight = weight;

      return manager.save(ModuleEvaluatorEntity, moduleEvaluator);
    });
  }

  public async createBattle(evaluationModuleId: string, assetAId: string, assetBId: string): Promise<EvaluationBattleEntity> {
    const module = await this.evaluationRepository.findEvaluationModuleById(evaluationModuleId);
    if (!module) throw new Error(ERROR_MESSAGES.EVALUATION_MODULE_NOT_FOUND);

    if (assetAId === assetBId) {
      throw new Error(ERROR_MESSAGES.SAME_ASSET_BATTLE);
    }

    // 使用公共方法验证媒体文件
    await this.validateBattleAssets(assetAId, assetBId, module.teamId);

    const battle = new EvaluationBattleEntity();
    battle.id = generateDbId();
    battle.evaluationModuleId = evaluationModuleId;
    battle.assetAId = assetAId;
    battle.assetBId = assetBId;

    return this.evaluationRepository.saveBattle(battle);
  }

  public async getBattle(battleId: string): Promise<EvaluationBattleEntity | null> {
    return this.evaluationRepository.findBattleById(battleId);
  }

  public async addParticipants(evaluationModuleId: string, assetIds: string[]): Promise<void> {
    return this.dataSource.transaction(async (manager) => {
      const module = await this.evaluationRepository.findEvaluationModuleById(evaluationModuleId, manager);
      if (!module) throw new Error(ERROR_MESSAGES.EVALUATION_MODULE_NOT_FOUND);

      // 使用公共方法验证资产有效性
      await this.validateBatchAssets(assetIds, module.teamId);

      // 去重并合并参与者
      const currentParticipants = new Set(module.participantAssetIds || []);
      const newParticipants = assetIds.filter((id) => !currentParticipants.has(id));

      if (newParticipants.length === 0) {
        return; // 没有新的参与者需要添加
      }

      newParticipants.forEach((id) => currentParticipants.add(id));
      module.participantAssetIds = Array.from(currentParticipants);

      await manager.save(EvaluationModuleEntity, module);
    });
  }

  public async getLeaderboardScores(evaluationModuleId: string, evaluatorId?: string, page: number = 1, limit: number = 10): Promise<{ list: LeaderboardScoreEntity[]; totalCount: number }> {
    return this.evaluationRepository.getLeaderboardScores(evaluationModuleId, evaluatorId, page, limit);
  }

  public async createBattleGroup(evaluationModuleId: string, assetIds: string[], strategy: BattleStrategy, battleCount?: number, description?: string): Promise<BattleGroupEntity> {
    const module = await this.evaluationRepository.findEvaluationModuleById(evaluationModuleId);
    if (!module) throw new Error(ERROR_MESSAGES.EVALUATION_MODULE_NOT_FOUND);

    const validation = this.battleStrategyService.validateBattleConfig(strategy, assetIds, battleCount);
    if (!validation.isValid) throw new Error(validation.error);

    // 使用公共方法验证资产有效性
    await this.validateBatchAssets(assetIds, module.teamId);

    const battlePairs = this.battleStrategyService.generateBattlePairs(strategy, assetIds, battleCount);

    return this.dataSource.transaction(async (manager) => {
      const battleGroup = new BattleGroupEntity();
      battleGroup.id = generateDbId();
      battleGroup.evaluationModuleId = evaluationModuleId;
      battleGroup.assetIds = assetIds;
      battleGroup.strategy = strategy;
      battleGroup.totalBattles = battlePairs.length;
      battleGroup.completedBattles = 0;
      battleGroup.failedBattles = 0;
      battleGroup.status = BattleGroupStatus.PENDING;
      battleGroup.description = description;

      const savedBattleGroup = await manager.save(BattleGroupEntity, battleGroup);

      for (const pair of battlePairs) {
        const battle = new EvaluationBattleEntity();
        battle.id = generateDbId();
        battle.evaluationModuleId = evaluationModuleId;
        battle.assetAId = pair.assetAId;
        battle.assetBId = pair.assetBId;
        battle.battleGroupId = savedBattleGroup.id;

        await manager.save(EvaluationBattleEntity, battle);
      }

      return savedBattleGroup;
    });
  }

  public async getBattleGroup(battleGroupId: string): Promise<BattleGroupEntity | null> {
    return this.evaluationRepository.findBattleGroupById(battleGroupId);
  }

  public async getBattlesByGroup(battleGroupId: string, status?: string): Promise<EvaluationBattleEntity[]> {
    return this.evaluationRepository.findBattlesByGroupId(battleGroupId, status);
  }

  public async autoEvaluateBattleGroup(battleGroupId: string): Promise<{
    success: boolean;
    totalBattles: number;
    completedBattles: number;
    failedBattles: number;
    errors: string[];
  }> {
    this.logger.debug(`Starting auto-evaluation for battle group: ${battleGroupId}`);
    return this.dataSource.transaction(async (manager) => {
      const battleGroup = await this.evaluationRepository.findBattleGroupById(battleGroupId, manager);
      if (!battleGroup) throw new Error(ERROR_MESSAGES.BATTLE_GROUP_NOT_FOUND);

      this.logger.debug(`Found battle group: ${battleGroup.id}, status: ${battleGroup.status}`);
      const pendingBattles = await this.evaluationRepository.findBattlesByGroupId(battleGroupId, 'PENDING', manager);
      this.logger.debug(`Found ${pendingBattles.length} pending battles for group ${battleGroupId}`);

      // 更新开始状态
      battleGroup.status = BattleGroupStatus.IN_PROGRESS;
      battleGroup.startedAt = new Date();
      await manager.save(BattleGroupEntity, battleGroup);

      const errors: string[] = [];
      let completedCount = 0;
      let failedCount = 0;

      // 批量处理对战，减少数据库交互
      const batchSize = 10;
      for (let i = 0; i < pendingBattles.length; i += batchSize) {
        const batch = pendingBattles.slice(i, i + batchSize);
        this.logger.debug(`Processing batch ${i / batchSize + 1} of ${Math.ceil(pendingBattles.length / batchSize)} for group ${battleGroupId}. Batch size: ${batch.length}`);
        const batchResults = await Promise.allSettled(batch.map((battle) => this.processSingleBattle(battle.id)));

        // 统计批次结果
        let batchCompleted = 0;
        let batchFailed = 0;

        batchResults.forEach((result, index) => {
          const battle = batch[index];
          if (result.status === 'fulfilled' && result.value.success) {
            batchCompleted++;
          } else {
            batchFailed++;
            const error = result.status === 'rejected' ? result.reason.message : result.value.error;
            errors.push(`Battle ${battle.id}: ${error}`);
          }
        });

        completedCount += batchCompleted;
        failedCount += batchFailed;

        // 批量更新进度
        battleGroup.completedBattles += batchCompleted;
        battleGroup.failedBattles += batchFailed;
        await manager.save(BattleGroupEntity, battleGroup);

        // 批次间延迟
        if (i + batchSize < pendingBattles.length) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }

      // 更新最终状态
      const isAllCompleted = completedCount + failedCount === pendingBattles.length;
      battleGroup.status = failedCount === 0 ? BattleGroupStatus.COMPLETED : completedCount > 0 ? BattleGroupStatus.IN_PROGRESS : BattleGroupStatus.FAILED;

      if (isAllCompleted) {
        battleGroup.completedAt = new Date();
      }

      await manager.save(BattleGroupEntity, battleGroup);

      this.logger.debug(`Finished auto-evaluation for battle group: ${battleGroupId}. Completed: ${completedCount}, Failed: ${failedCount}`);
      return {
        success: failedCount === 0,
        totalBattles: pendingBattles.length,
        completedBattles: completedCount,
        failedBattles: failedCount,
        errors,
      };
    });
  }

  private async processSingleBattle(battleId: string): Promise<{ success: boolean; result?: BattleResult; error?: string }> {
    this.logger.debug(`Processing single battle: ${battleId}`);
    try {
      const result = await this.autoEvaluateBattle(battleId);
      this.logger.debug(`Successfully processed battle ${battleId}, result: ${result.result}`);
      return result;
    } catch (error) {
      this.logger.error(`Error processing battle ${battleId}: ${error.message}`, error.stack);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  public async getBattleGroupsByEvaluationModule(evaluationModuleId: string, page: number = 1, limit: number = 10): Promise<{ list: BattleGroupEntity[]; totalCount: number }> {
    return this.evaluationRepository.getBattleGroupsByEvaluationModule(evaluationModuleId, page, limit);
  }

  public async listEvaluationModules(teamId: string, page: number = 1, limit: number = 10, search?: string): Promise<{ list: EvaluationModuleEntity[]; totalCount: number }> {
    return this.evaluationRepository.listEvaluationModules(teamId, page, limit, search);
  }

  public async getEvaluationModule(evaluationModuleId: string): Promise<EvaluationModuleEntity | null> {
    return this.evaluationRepository.findEvaluationModuleById(evaluationModuleId);
  }

  public async deleteEvaluationModule(evaluationModuleId: string): Promise<void> {
    const module = await this.evaluationRepository.findEvaluationModuleById(evaluationModuleId);
    if (!module) throw new Error(ERROR_MESSAGES.EVALUATION_MODULE_NOT_FOUND);

    return this.dataSource.transaction(async (manager) => {
      await manager.delete(EvaluationModuleEntity, { id: evaluationModuleId });
      await manager.delete(LeaderboardEntity, { id: module.leaderboardId });
    });
  }

  public async getEvaluationModuleBattles(evaluationModuleId: string, page: number = 1, limit: number = 10): Promise<{ list: EvaluationBattleEntity[]; totalCount: number }> {
    return this.evaluationRepository.getEvaluationModuleBattles(evaluationModuleId, page, limit);
  }

  public async submitBattleResult(battleId: string, result: BattleResult, evaluatorId: string, reason?: string): Promise<void> {
    evaluatorId = await this.getOrCreateDefaultLlmEvaluator(battleId, evaluatorId);
    this.logger.debug(`Submitting battle result for battle: ${battleId}, result: ${result}, evaluator: ${evaluatorId}`);
    return this.dataSource.transaction(async (manager) => {
      const battle = await this.evaluationRepository.findBattleById(battleId, manager);
      if (!battle) throw new Error(ERROR_MESSAGES.BATTLE_NOT_FOUND);
      this.logger.debug(`Found battle ${battleId} for result submission.`);

      const module = await this.evaluationRepository.findEvaluationModuleById(battle.evaluationModuleId, manager);
      if (!module) throw new Error('Evaluation module not found for this battle');

      const glickoEngine = new Glicko2(module.glickoConfig);

      const [scoreA, scoreB] = await this.findOrCreateScoresForAssets(battle.evaluationModuleId, [battle.assetAId, battle.assetBId], manager);
      this.logger.debug(`Scores found/created for assets ${battle.assetAId} and ${battle.assetBId}`);

      const playerA_score = scoreA.scoresByEvaluator[evaluatorId] || module.glickoConfig;
      const playerB_score = scoreB.scoresByEvaluator[evaluatorId] || module.glickoConfig;

      this.logger.debug(`[Battle ${battleId}] Before Glicko update - Asset A: ${JSON.stringify(playerA_score)}, Asset B: ${JSON.stringify(playerB_score)}`);

      // 保存对战前的评分
      battle.assetARatingBefore = playerA_score.rating;
      battle.assetBRatingBefore = playerB_score.rating;

      const playerA = glickoEngine.makePlayer(playerA_score.rating, playerA_score.rd, playerA_score.vol);
      const playerB = glickoEngine.makePlayer(playerB_score.rating, playerB_score.rd, playerB_score.vol);

      const matches: [Player, Player, number][] = [];
      if (result === BattleResult.A_WIN) {
        matches.push([playerA, playerB, 1]);
        battle.winnerId = battle.assetAId;
      } else if (result === BattleResult.B_WIN) {
        matches.push([playerA, playerB, 0]);
        battle.winnerId = battle.assetBId;
      } else {
        matches.push([playerA, playerB, 0.5]);
        battle.winnerId = null;
      }

      glickoEngine.updateRatings(matches);
      this.logger.debug(`Glicko ratings updated for battle ${battleId}.`);

      const newRatingA = playerA.getRating();
      const newRatingB = playerB.getRating();
      this.logger.debug(`[Battle ${battleId}] After Glicko update - Asset A new rating: ${newRatingA}, Asset B new rating: ${newRatingB}`);

      scoreA.scoresByEvaluator[evaluatorId] = {
        rating: newRatingA,
        rd: playerA.getRd(),
        vol: playerA.getVol(),
      };
      scoreB.scoresByEvaluator[evaluatorId] = {
        rating: newRatingB,
        rd: playerB.getRd(),
        vol: playerB.getVol(),
      };

      scoreA.gamesPlayed += 1;
      scoreB.gamesPlayed += 1;

      // 保存对战后的评分和完成时间
      battle.assetARatingAfter = newRatingA;
      battle.assetBRatingAfter = newRatingB;
      battle.completedAt = new Date();
      battle.result = result;
      battle.evaluatorId = evaluatorId;
      battle.reason = reason;

      this.logger.debug(`[Battle ${battleId}] Saving updated battle and score entities to database.`);
      await this.evaluationRefactoredRepository.saveBattleAndScores(battle, [scoreA, scoreB], manager);
      this.logger.debug(`Successfully saved battle result and updated scores for battle ${battleId}`);
    });
  }

  private async findOrCreateScoresForAssets(evaluationModuleId: string, assetIds: string[], manager: EntityManager): Promise<LeaderboardScoreEntity[]> {
    // 使用数据库锁来确保并发安全
    const existingScores = await manager
      .createQueryBuilder(LeaderboardScoreEntity, 'score')
      .setLock('pessimistic_write')
      .where('score.evaluationModuleId = :evaluationModuleId', { evaluationModuleId })
      .andWhere('score.assetId IN (:...assetIds)', { assetIds })
      .getMany();

    const existingAssetIds = new Set(existingScores.map((s) => s.assetId));

    const newScores: LeaderboardScoreEntity[] = [];
    for (const assetId of assetIds) {
      if (!existingAssetIds.has(assetId)) {
        // 双重检查：再次查询确保没有其他事务创建了相同的记录
        const doubleCheckScore = await manager
          .createQueryBuilder(LeaderboardScoreEntity, 'score')
          .where('score.evaluationModuleId = :evaluationModuleId', { evaluationModuleId })
          .andWhere('score.assetId = :assetId', { assetId })
          .getOne();

        if (!doubleCheckScore) {
          const newScore = new LeaderboardScoreEntity();
          newScore.id = generateDbId();
          newScore.evaluationModuleId = evaluationModuleId;
          newScore.assetId = assetId;
          newScore.scoresByEvaluator = {};
          newScore.gamesPlayed = 0;
          newScores.push(newScore);
        } else {
          existingScores.push(doubleCheckScore);
        }
      }
    }

    // 如果有新的评分记录，批量保存
    if (newScores.length > 0) {
      await manager.save(LeaderboardScoreEntity, newScores);
    }

    return [...existingScores, ...newScores];
  }

  public async autoEvaluateBattle(battleId: string): Promise<{ success: boolean; result?: BattleResult; error?: string }> {
    this.logger.debug(`Starting auto-evaluation for battle: ${battleId}`);
    try {
      const battle = await this.evaluationRepository.findBattleById(battleId);
      if (!battle) throw new Error(ERROR_MESSAGES.BATTLE_NOT_FOUND);
      this.logger.debug(`Found battle ${battleId}, assets: ${battle.assetAId} vs ${battle.assetBId}`);

      const module = await this.evaluationRepository.findEvaluationModuleById(battle.evaluationModuleId);
      if (!module) throw new Error(ERROR_MESSAGES.EVALUATION_MODULE_NOT_FOUND);

      let llmEvaluators = await this.evaluationRepository.getActiveEvaluatorsByModule(battle.evaluationModuleId, EvaluatorType.LLM);

      if (llmEvaluators.length === 0) {
        this.logger.debug(`[Battle ${battleId}] No LLM evaluators found, creating default one.`);
        const newEvaluatorId = await this.getOrCreateDefaultLlmEvaluator(module.id, VIRTUAL_LLM_EVALUATOR_ID);
        const newEvaluator = await this.getEvaluator(newEvaluatorId);
        if (!newEvaluator) {
          throw new Error('Failed to create and retrieve default evaluator.');
        }
        llmEvaluators = [newEvaluator];
      }

      const evaluator = llmEvaluators[0];
      this.logger.debug(`[Battle ${battleId}] Using evaluator ${evaluator.id} with model ${evaluator.llmModelName}`);

      const { mediaA, mediaB } = await this.validateBattleAssets(battle.assetAId, battle.assetBId, module.teamId);

      // 为两张图片生成公网可访问的 URL
      const publicUrlA = await this.mediaFileService.getPublicUrl(mediaA);
      const publicUrlB = await this.mediaFileService.getPublicUrl(mediaB);
      this.logger.debug(`[Battle ${battleId}] Generated public URLs. Asset A: ${publicUrlA}, Asset B: ${publicUrlB}`);

      const fullPrompt = this.buildEvaluationPrompt(evaluator.evaluationFocus || DEFAULT_EVALUATION_FOCUS);

      const messages = [
        {
          role: 'user' as const,
          content: [
            { type: 'image_url' as const, image_url: { url: publicUrlA, detail: 'high' as const } },
            { type: 'image_url' as const, image_url: { url: publicUrlB, detail: 'high' as const } },

            { type: 'text' as const, text: fullPrompt },
          ],
        },
      ];

      this.logger.debug(`Calling LLM for battle ${battleId} with model ${evaluator.llmModelName}`);
      const response = await this.llmService.createChatCompelitions(
        null,
        module.teamId,
        {
          messages,
          model: (evaluator.llmModelName || config.evaluation.defaultLlmEvaluatorModel).replace('llm:', ''),
          temperature: 0.1,
          max_tokens: 500,
          stream: false,
        },
        { apiResponseType: 'simple' },
      );

      const llmRawResponse = (response as any).message;
      this.logger.debug(`[Battle ${battleId}] Received raw response from LLM: ${llmRawResponse}`);

      const llmResult = this.parseLlmEvaluationResult(llmRawResponse);
      this.logger.debug(`[Battle ${battleId}] Parsed LLM result: ${JSON.stringify(llmResult)}`);

      await this.submitBattleResult(battleId, llmResult.result, evaluator.id);
      this.logger.debug(`Submitted battle result for ${battleId} after LLM evaluation.`);

      return {
        success: true,
        result: llmResult.result,
      };
    } catch (error) {
      this.logger.error(`Error during auto-evaluation of battle ${battleId}: ${error.message}`, error.stack);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  private parseLlmEvaluationResult(llmResponse: string): { result: BattleResult } {
    try {
      const jsonMatch = llmResponse.match(/\{[^}]*"winner"[^}]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const winner = parsed.winner?.toLowerCase();

        if (winner === 'a') return { result: BattleResult.A_WIN };
        if (winner === 'b') return { result: BattleResult.B_WIN };
        if (winner === 'draw') return { result: BattleResult.DRAW };
      }

      const responseUpper = llmResponse.toUpperCase();

      if (responseUpper.includes('WINNER": "A"') || responseUpper.includes('"A"')) {
        return { result: BattleResult.A_WIN };
      } else if (responseUpper.includes('WINNER": "B"') || responseUpper.includes('"B"')) {
        return { result: BattleResult.B_WIN };
      } else if (responseUpper.includes('WINNER": "DRAW"') || responseUpper.includes('"DRAW"')) {
        return { result: BattleResult.DRAW };
      }

      return { result: BattleResult.DRAW };
    } catch (error) {
      return { result: BattleResult.DRAW };
    }
  }

  public async getEloLeaderboard(
    moduleId: string,
    options: {
      page?: number;
      limit?: number;
      evaluatorId?: string;
      sortBy?: 'rating' | 'rd' | 'vol' | 'battles' | 'winRate';
      sortOrder?: 'ASC' | 'DESC';
      minBattles?: number;
      search?: string;
    } = {},
  ) {
    const { page = 1, limit = 20, evaluatorId, sortBy = 'rating', sortOrder = 'DESC', minBattles = 0, search } = options;

    const module = await this.getEvaluationModule(moduleId);
    if (!module) {
      throw new Error(ERROR_MESSAGES.EVALUATION_MODULE_NOT_FOUND);
    }

    const scores = await this.evaluationRefactoredRepository.getLeaderboardScoresWithBattleStats(moduleId, evaluatorId, page, limit, sortBy, sortOrder, minBattles, search);

    const total = await this.evaluationRefactoredRepository.countLeaderboardScores(moduleId, evaluatorId, minBattles, search);

    const stats = await this.evaluationRefactoredRepository.getLeaderboardStats(moduleId, evaluatorId);

    const items = scores.map((score, index) => ({
      rank: (page - 1) * limit + index + 1,
      assetId: score.assetId,
      asset: score.asset || {
        id: score.assetId,
        name: `Asset ${score.assetId}`,
        type: 'unknown',
      },
      rating: score.rating,
      rd: score.rd,
      vol: score.vol,
      totalBattles: score.totalBattles || 0,
      wins: score.wins || 0,
      losses: score.losses || 0,
      draws: score.draws || 0,
      winRate: score.totalBattles > 0 ? Math.round((score.wins / score.totalBattles) * 100) / 100 : 0,
      lastUpdated: score.updatedAt,
      evaluatorId: score.evaluatorId,
      evaluator: score.evaluator,
    }));

    return {
      items,
      total,
      page,
      limit,
      module: {
        id: module.id,
        name: module.displayName,
        description: module.description,
        totalParticipants: module.participantAssetIds?.length || 0,
        totalBattles: await this.evaluationRefactoredRepository.countModuleBattles(moduleId),
      },
      stats: {
        averageRating: stats.averageRating || 1500,
        highestRating: stats.highestRating || 1500,
        lowestRating: stats.lowestRating || 1500,
        mostActiveBattler: stats.mostActiveBattler || {
          assetId: '',
          assetName: 'N/A',
          battleCount: 0,
        },
        lastUpdated: stats.lastUpdated || new Date(),
      },
    };
  }

  public async getRecentBattlesWithRatingChanges(moduleId: string, since: Date, limit: number = 50) {
    return this.evaluationRefactoredRepository.getRecentBattlesWithRatingChanges(moduleId, since, limit);
  }

  public async getAssetRatingHistory(assetId: string, moduleId: string, evaluatorId?: string, limit: number = 50) {
    const battles = await this.evaluationRefactoredRepository.getAssetRatingHistory(assetId, moduleId, evaluatorId, limit);

    return battles.map((battle) => {
      const isAssetA = battle.assetAId === assetId;
      const opponent = isAssetA ? battle.assetBId : battle.assetAId;
      const oldRating = isAssetA ? battle.assetARatingBefore : battle.assetBRatingBefore;
      const newRating = isAssetA ? battle.assetARatingAfter : battle.assetBRatingAfter;
      const change = (newRating || 0) - (oldRating || 0);

      return {
        battleId: battle.id,
        date: battle.completedAt || new Date(battle.createdTimestamp),
        opponent: {
          id: opponent,
          name: `Asset ${opponent}`,
        },
        oldRating: Math.round(oldRating || 0),
        newRating: Math.round(newRating || 0),
        change: Math.round(change),
        result: battle.result,
        won: (isAssetA && battle.result === 'A_WIN') || (!isAssetA && battle.result === 'B_WIN'),
        evaluator: battle.evaluator?.name || 'Unknown',
      };
    });
  }

  public async getRatingTrends(moduleId: string, days: number = 30, _evaluatorId?: string, limit: number = 20, minBattles: number = 5) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const battles = await this.evaluationRefactoredRepository.getRecentBattlesWithRatingChanges(
      moduleId,
      since,
      5000, // 获取更多数据用于分析
    );

    // 按资产分组并构建评分时间序列
    const assetTrends = new Map<string, Array<{ date: Date; rating: number; battleId: string }>>();

    battles.forEach((battle) => {
      // 处理资产A
      if (battle.assetARatingAfter !== null && battle.assetARatingAfter !== undefined) {
        if (!assetTrends.has(battle.assetAId)) {
          assetTrends.set(battle.assetAId, []);
        }
        assetTrends.get(battle.assetAId)!.push({
          date: battle.completedAt || new Date(battle.createdTimestamp),
          rating: battle.assetARatingAfter,
          battleId: battle.id,
        });
      }

      // 处理资产B
      if (battle.assetBRatingAfter !== null && battle.assetBRatingAfter !== undefined) {
        if (!assetTrends.has(battle.assetBId)) {
          assetTrends.set(battle.assetBId, []);
        }
        assetTrends.get(battle.assetBId)!.push({
          date: battle.completedAt || new Date(battle.createdTimestamp),
          rating: battle.assetBRatingAfter,
          battleId: battle.id,
        });
      }
    });

    // 转换为前端需要的格式，并应用过滤条件
    const trends = Array.from(assetTrends.entries())
      .filter(([, points]) => points.length >= minBattles) // 过滤掉对战次数太少的
      .map(([assetId, points]) => {
        // 按时间排序
        points.sort((a, b) => a.date.getTime() - b.date.getTime());

        // 计算统计信息
        const ratings = points.map((p) => p.rating);
        const maxRating = Math.max(...ratings);
        const minRating = Math.min(...ratings);
        const ratingChange = ratings.length > 1 ? ratings[ratings.length - 1] - ratings[0] : 0;

        return {
          assetId,
          assetName: `Asset ${assetId}`,
          points: points.map((point) => ({
            date: point.date.toISOString(),
            rating: Math.round(point.rating),
            battleId: point.battleId,
          })),
          currentRating: Math.round(ratings[ratings.length - 1] || 1500),
          startRating: Math.round(ratings[0] || 1500),
          maxRating: Math.round(maxRating),
          minRating: Math.round(minRating),
          ratingChange: Math.round(ratingChange),
          totalBattles: points.length,
          winRate: 0, // 需要额外计算
          volatility: Math.round(this.calculateVolatility(ratings)),
        };
      });

    // 按当前评分排序
    trends.sort((a, b) => b.currentRating - a.currentRating);

    return {
      trends: trends.slice(0, limit),
      period: {
        start: since.toISOString(),
        end: new Date().toISOString(),
        days,
      },
      summary: {
        totalAssets: trends.length,
        totalBattles: battles.length,
        averageRating: trends.length > 0 ? Math.round(trends.reduce((sum, t) => sum + t.currentRating, 0) / trends.length) : 1500,
        highestRating: trends.length > 0 ? trends[0].currentRating : 1500,
        lowestRating: trends.length > 0 ? trends[trends.length - 1].currentRating : 1500,
        mostImproved: trends.length > 0 ? trends.reduce((best, current) => (current.ratingChange > best.ratingChange ? current : best)) : null,
        mostActive: trends.length > 0 ? trends.reduce((best, current) => (current.totalBattles > best.totalBattles ? current : best)) : null,
      },
    };
  }

  public async getChartData(moduleId: string, evaluatorId?: string, days: number = 30, dataType?: string) {
    const baseData = {
      moduleId,
      evaluatorId,
      period: {
        days,
        start: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString(),
      },
    };

    switch (dataType) {
      case 'trends':
        return {
          ...baseData,
          type: 'trends',
          data: await this.getRatingTrends(moduleId, days, evaluatorId, 50, 3),
        };

      case 'distribution':
        return {
          ...baseData,
          type: 'distribution',
          data: await this.getRatingDistribution(moduleId, evaluatorId),
        };

      case 'heatmap':
        return {
          ...baseData,
          type: 'heatmap',
          data: await this.getBattleMatrix(moduleId, evaluatorId, days),
        };

      case 'timeline':
        return {
          ...baseData,
          type: 'timeline',
          data: await this.getTimelineData(moduleId, evaluatorId, days),
        };

      default:
        // 返回完整数据集
        const [trends, distribution, timeline] = await Promise.all([
          this.getRatingTrends(moduleId, days, evaluatorId, 20, 3),
          this.getRatingDistribution(moduleId, evaluatorId),
          this.getTimelineData(moduleId, evaluatorId, days),
        ]);

        return {
          ...baseData,
          type: 'complete',
          data: {
            trends,
            distribution,
            timeline,
            summary: trends.summary,
          },
        };
    }
  }

  private calculateVolatility(ratings: number[]): number {
    if (ratings.length < 2) return 0;

    const mean = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
    const variance = ratings.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / ratings.length;
    return Math.sqrt(variance);
  }

  private async getRatingDistribution(moduleId: string, evaluatorId?: string) {
    const leaderboard = await this.getEloLeaderboard(moduleId, {
      limit: 1000,
      evaluatorId,
    });

    const ranges = [
      { min: 0, max: 1200, label: '新手', color: '#94a3b8' },
      { min: 1200, max: 1400, label: '初级', color: '#10b981' },
      { min: 1400, max: 1600, label: '中级', color: '#3b82f6' },
      { min: 1600, max: 1800, label: '高级', color: '#8b5cf6' },
      { min: 1800, max: 2000, label: '专家', color: '#ef4444' },
      { min: 2000, max: Infinity, label: '大师', color: '#f59e0b' },
    ];

    return {
      ranges: ranges.map((range) => ({
        ...range,
        count: leaderboard.items.filter((item) => item.rating >= range.min && item.rating < range.max).length,
        percentage: Math.round((leaderboard.items.filter((item) => item.rating >= range.min && item.rating < range.max).length / leaderboard.items.length) * 100),
      })),
      total: leaderboard.items.length,
      average: Math.round(leaderboard.items.reduce((sum, item) => sum + item.rating, 0) / leaderboard.items.length),
      median: this.calculateMedian(leaderboard.items.map((item) => item.rating)),
    };
  }

  private async getBattleMatrix(moduleId: string, _evaluatorId?: string, days: number = 30) {
    // 获取对战矩阵数据
    const since = new Date();
    since.setDate(since.getDate() - days);

    const battles = await this.evaluationRefactoredRepository.getRecentBattlesWithRatingChanges(moduleId, since, 2000);

    // 构建对战矩阵
    const matrix = new Map<string, Map<string, { wins: number; losses: number; total: number }>>();

    battles.forEach((battle) => {
      const assetA = battle.assetAId;
      const assetB = battle.assetBId;

      if (!matrix.has(assetA)) matrix.set(assetA, new Map());
      if (!matrix.has(assetB)) matrix.set(assetB, new Map());

      const initCell = { wins: 0, losses: 0, total: 0 };
      if (!matrix.get(assetA)!.has(assetB)) matrix.get(assetA)!.set(assetB, { ...initCell });
      if (!matrix.get(assetB)!.has(assetA)) matrix.get(assetB)!.set(assetA, { ...initCell });

      const cellAB = matrix.get(assetA)!.get(assetB)!;
      const cellBA = matrix.get(assetB)!.get(assetA)!;

      cellAB.total++;
      cellBA.total++;

      if (battle.result === 'A_WIN') {
        cellAB.wins++;
        cellBA.losses++;
      } else if (battle.result === 'B_WIN') {
        cellAB.losses++;
        cellBA.wins++;
      }
    });

    return {
      matrix: Array.from(matrix.entries()).map(([assetId, opponents]) => ({
        assetId,
        assetName: `Asset ${assetId}`,
        opponents: Array.from(opponents.entries()).map(([opponentId, stats]) => ({
          opponentId,
          opponentName: `Asset ${opponentId}`,
          ...stats,
          winRate: stats.total > 0 ? Math.round((stats.wins / stats.total) * 100) : 0,
        })),
      })),
      totalBattles: battles.length,
    };
  }

  private async getTimelineData(moduleId: string, _evaluatorId?: string, days: number = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const battles = await this.evaluationRefactoredRepository.getRecentBattlesWithRatingChanges(moduleId, since, 1000);

    // 按日期分组
    const dailyStats = new Map<string, { battles: number; totalRatingChange: number; participants: Set<string> }>();

    battles.forEach((battle) => {
      const date = (battle.completedAt || new Date(battle.createdTimestamp)).toISOString().split('T')[0];

      if (!dailyStats.has(date)) {
        dailyStats.set(date, { battles: 0, totalRatingChange: 0, participants: new Set() });
      }

      const dayStats = dailyStats.get(date)!;
      dayStats.battles++;
      dayStats.participants.add(battle.assetAId);
      dayStats.participants.add(battle.assetBId);

      const ratingChangeA = Math.abs((battle.assetARatingAfter || 0) - (battle.assetARatingBefore || 0));
      const ratingChangeB = Math.abs((battle.assetBRatingAfter || 0) - (battle.assetBRatingBefore || 0));
      dayStats.totalRatingChange += ratingChangeA + ratingChangeB;
    });

    return {
      timeline: Array.from(dailyStats.entries())
        .map(([date, stats]) => ({
          date,
          battles: stats.battles,
          participants: stats.participants.size,
          averageRatingChange: stats.battles > 0 ? Math.round(stats.totalRatingChange / stats.battles / 2) : 0,
        }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    };
  }

  private calculateMedian(numbers: number[]): number {
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
  }
}
