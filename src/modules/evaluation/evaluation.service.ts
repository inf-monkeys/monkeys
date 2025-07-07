import { config } from '@/common/config';
import { generateDbId } from '@/common/utils';
import { BattleGroupEntity, BattleGroupStatus, BattleStrategy } from '@/database/entities/evaluation/battle-group.entity';
import { BattleResult, EvaluationBattleEntity } from '@/database/entities/evaluation/evaluation-battle.entity';
import { EvaluationModuleEntity } from '@/database/entities/evaluation/evaluation-module.entity';
import { EvaluationRatingHistoryEntity } from '@/database/entities/evaluation/evaluation-rating-history.entity';
import { EvaluationTaskEntity } from '@/database/entities/evaluation/evaluation-task.entity';
import { EvaluatorEntity, EvaluatorType } from '@/database/entities/evaluation/evaluator.entity';
import { LeaderboardScoreEntity } from '@/database/entities/evaluation/leaderboard-score.entity';
import { LeaderboardEntity } from '@/database/entities/evaluation/leaderboard.entity';
import { ModuleEvaluatorEntity } from '@/database/entities/evaluation/module-evaluator.entity';
import { EvaluationRefactoredRepository } from '@/database/repositories/evaluation-refactored.repository';
import { EvaluationRepository } from '@/database/repositories/evaluation.repository';
import { MediaFileService } from '@/modules/assets/media/media.service';
import { LlmService } from '@/modules/tools/llm/llm.service';
import { Injectable, Logger } from '@nestjs/common';
import { isObject } from 'lodash';
import { DataSource } from 'typeorm';
import { BattleStrategyService } from './battle-strategy.service';
import { OpenSkillService } from './services/openskill.service';
import { PgTaskQueueService } from './services/pg-task-queue.service';
import { TaskType } from './types/task.types';

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

export const BASE_EVALUATION_TEMPLATE = `Compare these two images and determine which one is better based SOLELY on the following criteria:

EVALUATION CRITERIA: {EVALUATION_FOCUS}

You must judge the images ONLY based on this specific criteria. Ignore all other factors such as technical quality, composition, aesthetics, or visual appeal unless they are explicitly part of the evaluation criteria.

Focus exclusively on: {EVALUATION_FOCUS}

Rules:
1. Output ONLY a JSON object
2. Use "A" for first image, "B" for second image, "draw" for equal quality
3. Judge ONLY based on: {EVALUATION_FOCUS}
4. Ignore all other image qualities
5. No explanations or additional text

Format: {"winner": "A"}`;

export const DEFAULT_EVALUATION_FOCUS = 'overall image quality and aesthetic appeal';

export interface CreateEvaluationModuleDto {
  displayName: string;
  description?: string;
  evaluationCriteria?: string;
  participantAssetIds?: string[];
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
    private readonly pgTaskQueueService: PgTaskQueueService,
    private readonly openskillService: OpenSkillService,
  ) {}

  private buildEvaluationPrompt(evaluationFocus: string): string {
    return BASE_EVALUATION_TEMPLATE.replace(/{EVALUATION_FOCUS}/g, evaluationFocus.trim());
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
    // 1. 使用 In 操作符一次性获取所有资产
    const mediaFiles = await this.mediaFileService.getMediaByIds(assetIds);

    // 2. 在内存中进行校验
    if (mediaFiles.length !== assetIds.length) {
      throw new Error('部分资产不存在。');
    }

    const invalidMedia = mediaFiles.some((media) => media.teamId !== teamId);
    if (invalidMedia) {
      throw new Error('部分资产不属于该团队或无权访问。');
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

  public async autoEvaluateBattleGroup(battleGroupId: string, teamId: string, userId: string): Promise<any> {
    const battleGroup = await this.evaluationRepository.findBattleGroupById(battleGroupId);
    if (!battleGroup) throw new Error(ERROR_MESSAGES.BATTLE_GROUP_NOT_FOUND);

    const pendingBattles = await this.evaluationRepository.findBattlesByGroupId(battleGroupId, 'PENDING');

    const task = await this.pgTaskQueueService.createTask({
      type: TaskType.EVALUATE_BATTLE_GROUP,
      moduleId: battleGroup.evaluationModuleId,
      teamId,
      userId,
      total: pendingBattles.length,
      payload: {
        battleGroupId,
      },
    });

    // 更新 battleGroup 状态
    battleGroup.status = BattleGroupStatus.IN_PROGRESS;
    battleGroup.startedAt = new Date();
    await this.evaluationRepository.saveBattleGroup(battleGroup);

    return {
      success: true,
      message: 'Evaluation task created successfully',
      taskId: task.id,
    };
  }

  private async processSingleBattle(battleId: string): Promise<{ success: boolean; result?: BattleResult; error?: string }> {
    try {
      const result = await this.autoEvaluateBattle(battleId);
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
      // 1. 先删除对战记录，避免外键约束
      await manager.delete(EvaluationBattleEntity, { evaluationModuleId });
      // 2. 再删除对战组
      await manager.delete(BattleGroupEntity, { evaluationModuleId });
      // 3. 删除模块评测员关联
      await manager.delete(ModuleEvaluatorEntity, { evaluationModuleId });
      // 4. 删除排行榜分数记录
      await manager.delete(LeaderboardScoreEntity, { evaluationModuleId });
      // 5. 删除评分历史记录
      await manager.delete(EvaluationRatingHistoryEntity, { evaluationModuleId }); // 将所有字符串表名改为使用实体类，让 TypeORM 自动处理表名前缀
      // 6. 删除任务队列中的相关任务
      await manager.delete(EvaluationTaskEntity, { moduleId: evaluationModuleId });

      // 7. 删除评测模块本身
      await manager.delete(EvaluationModuleEntity, { id: evaluationModuleId });
      // 8. 删除排行榜
      await manager.delete(LeaderboardEntity, { id: module.leaderboardId });
    });
  }

  public async getEvaluationModuleBattles(evaluationModuleId: string, page: number = 1, limit: number = 10): Promise<{ list: EvaluationBattleEntity[]; totalCount: number }> {
    return this.evaluationRepository.getEvaluationModuleBattles(evaluationModuleId, page, limit);
  }

  public async submitBattleResult(battleId: string, result: BattleResult, evaluatorId: string, reason?: string): Promise<void> {
    evaluatorId = await this.getOrCreateDefaultLlmEvaluator(battleId, evaluatorId);

    return this.dataSource.transaction(async (manager) => {
      const battle = await this.evaluationRepository.findBattleById(battleId, manager);
      if (!battle) {
        throw new Error(ERROR_MESSAGES.BATTLE_NOT_FOUND);
      }

      // 只更新对战结果，不进行评分计算
      battle.result = result;
      battle.evaluatorId = evaluatorId;
      battle.reason = reason;
      battle.completedAt = new Date();

      if (result === BattleResult.A_WIN) {
        battle.winnerId = battle.assetAId;
      } else if (result === BattleResult.B_WIN) {
        battle.winnerId = battle.assetBId;
      } else {
        battle.winnerId = null;
      }

      await manager.save(EvaluationBattleEntity, battle);

      // 更新统计数据
      const { assetAId, assetBId, evaluationModuleId } = battle;

      const getScore = async (assetId: string) => {
        let score = await manager.findOne(LeaderboardScoreEntity, { where: { evaluationModuleId, assetId } });
        if (!score) {
          score = manager.create(LeaderboardScoreEntity, {
            id: generateDbId(),
            evaluationModuleId,
            assetId,
            wins: 0,
            losses: 0,
            draws: 0,
            totalBattles: 0,
          });
        }
        return score;
      };

      const scoreA = await getScore(assetAId);
      const scoreB = await getScore(assetBId);

      scoreA.totalBattles += 1;
      scoreB.totalBattles += 1;

      if (result === BattleResult.A_WIN) {
        scoreA.wins += 1;
        scoreB.losses += 1;
      } else if (result === BattleResult.B_WIN) {
        scoreA.losses += 1;
        scoreB.wins += 1;
      } else {
        scoreA.draws += 1;
        scoreB.draws += 1;
      }

      await manager.save([scoreA, scoreB]);
    });
  }

  public async autoEvaluateBattle(battleId: string): Promise<{ success: boolean; result?: BattleResult; error?: string }> {
    try {
      const battle = await this.evaluationRepository.findBattleById(battleId);
      if (!battle) throw new Error(ERROR_MESSAGES.BATTLE_NOT_FOUND);

      const module = await this.evaluationRepository.findEvaluationModuleById(battle.evaluationModuleId);
      if (!module) throw new Error(ERROR_MESSAGES.EVALUATION_MODULE_NOT_FOUND);

      let llmEvaluators = await this.evaluationRepository.getActiveEvaluatorsByModule(battle.evaluationModuleId, EvaluatorType.LLM);

      if (llmEvaluators.length === 0) {
        const newEvaluatorId = await this.getOrCreateDefaultLlmEvaluator(module.id, VIRTUAL_LLM_EVALUATOR_ID);
        const newEvaluator = await this.getEvaluator(newEvaluatorId);
        if (!newEvaluator) {
          throw new Error('Failed to create and retrieve default evaluator.');
        }
        llmEvaluators = [newEvaluator];
      }

      const evaluator = llmEvaluators[0];

      const { mediaA, mediaB } = await this.validateBattleAssets(battle.assetAId, battle.assetBId, module.teamId);

      // 为两张图片生成公网可访问的 URL
      const publicUrlA = await this.mediaFileService.getPublicUrl(mediaA);
      const publicUrlB = await this.mediaFileService.getPublicUrl(mediaB);

      const evaluationFocus = module.evaluationCriteria || evaluator.evaluationFocus || DEFAULT_EVALUATION_FOCUS;
      const fullPrompt = this.buildEvaluationPrompt(evaluationFocus);

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

      const response = await this.llmService.createChatCompelitions(
        null,
        module.teamId,
        {
          messages,
          model: evaluator.llmModelName || config.evaluation.defaultLlmEvaluatorModel,
          temperature: 0.1,
          max_tokens: 500,
          stream: false,
        },
        { apiResponseType: 'simple' },
      );

      const llmRawResponse = (response as any).message;

      const llmResult = this.parseLlmEvaluationResult(llmRawResponse);

      await this.submitBattleResult(battleId, llmResult.result, evaluator.id);

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
    const startTime = Date.now();
    const { page = 1, limit = 20, evaluatorId, sortBy = 'rating', sortOrder = 'DESC', minBattles = 0, search } = options;
    this.logger.log(`Starting getEloLeaderboard for module ${moduleId}, page ${page}, limit ${limit}`);

    const module = await this.getEvaluationModule(moduleId);
    if (!module) {
      throw new Error(ERROR_MESSAGES.EVALUATION_MODULE_NOT_FOUND);
    }

    // 并行执行三个数据库查询以提高性能
    const [scores, total, stats] = await Promise.all([
      this.evaluationRefactoredRepository.getLeaderboardScoresWithBattleStats(moduleId, evaluatorId, page, limit, sortBy, sortOrder, minBattles, search),
      this.evaluationRefactoredRepository.countLeaderboardScores(moduleId, evaluatorId, minBattles, search),
      this.evaluationRefactoredRepository.getLeaderboardStats(moduleId, evaluatorId),
    ]);

    const items = scores.map((score, index) => {
      const totalBattles = parseInt(score.totalBattles, 10) || 0;
      const wins = parseInt(score.wins, 10) || 0;
      return {
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
        totalBattles: totalBattles,
        wins: wins,
        losses: parseInt(score.losses, 10) || 0,
        draws: parseInt(score.draws, 10) || 0,
        winRate: totalBattles > 0 ? Math.round((wins / totalBattles) * 100) / 100 : 0,
        lastUpdated: score.updatedAt,
        evaluatorId: score.evaluatorId,
        evaluator: score.evaluator,
      };
    });

    const totalDuration = Date.now() - startTime;
    this.logger.log(`getEloLeaderboard completed in ${totalDuration}ms for module ${moduleId}, returned ${items.length}/${total} items`);

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

  public async getAssetRatingHistory(assetId: string, moduleId: string, _evaluatorId?: string, limit: number = 50) {
    const history = await this.evaluationRefactoredRepository.getRatingHistoryForAsset(assetId, moduleId, limit);

    return history.map((record) => ({
      battleId: record.battleId,
      date: record.date,
      opponent: {
        id: record.opponentId,
        name: `Asset ${record.opponentId}`,
      },
      oldRating: Math.round(record.oldRating),
      newRating: Math.round(record.newRating),
      change: Math.round(record.change),
      result: record.result,
      won: (record.result === 'A_WIN' && record.opponentId !== assetId) || (record.result === 'B_WIN' && record.opponentId === assetId),
      evaluator: record.evaluatorName || 'Unknown',
    }));
  }

  public async getRatingTrends(moduleId: string, days: number = 30, _evaluatorId?: string, limit: number = 20, minBattles: number = 5) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const history = await this.evaluationRefactoredRepository.getAggregatedRatingTrends(moduleId, since);

    const assetTrends = new Map<string, Array<{ date: Date; rating: number }>>();
    for (const row of history) {
      if (!assetTrends.has(row.assetId)) {
        assetTrends.set(row.assetId, []);
      }
      assetTrends.get(row.assetId)!.push({
        date: new Date(row.date),
        rating: row.rating,
      });
    }

    const trends = Array.from(assetTrends.entries())
      .filter(([, points]) => points.length >= minBattles)
      .map(([assetId, points]) => {
        points.sort((a, b) => a.date.getTime() - b.date.getTime());
        const ratings = points.map((p) => p.rating);
        const currentRating = ratings[ratings.length - 1] || 0;
        const startRating = ratings[0] || 0;
        const ratingChange = currentRating - startRating;

        return {
          assetId,
          assetName: `Asset ${assetId}`,
          points: points.map((p) => ({ date: p.date.toISOString(), rating: Math.round(p.rating) })),
          currentRating: Math.round(currentRating),
          startRating: Math.round(startRating),
          maxRating: Math.round(Math.max(...ratings)),
          minRating: Math.round(Math.min(...ratings)),
          ratingChange: Math.round(ratingChange),
          totalBattles: points.length,
          winRate: 0, // Placeholder, requires more complex query
          volatility: Math.round(this.calculateVolatility(ratings)),
        };
      });

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
        totalBattles: history.length / 2, // Approximation
        averageRating: trends.length > 0 ? Math.round(trends.reduce((sum, t) => sum + t.currentRating, 0) / trends.length) : 1500,
        highestRating: trends.length > 0 ? trends[0].currentRating : 1500,
        lowestRating: trends.length > 0 ? trends[trends.length - 1].currentRating : 1500,
        mostImproved: trends.length > 0 ? trends.reduce((best, current) => (current.ratingChange > best.ratingChange ? current : best)) : null,
        mostActive: trends.length > 0 ? trends.reduce((best, current) => (current.totalBattles > best.totalBattles ? current : best)) : null,
      },
    };
  }

  public async getChartData(moduleId: string, evaluatorId?: string, days: number = 30, dataType?: string) {
    const startTime = Date.now();
    this.logger.log(`Starting getChartData for module ${moduleId}, dataType: ${dataType}, days: ${days}`);

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

        const totalDuration = Date.now() - startTime;
        this.logger.log(`getChartData(complete) completed in ${totalDuration}ms for module ${moduleId}`);

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

      // FIXME: Rating change calculation needs to be adapted for OpenSkill data from Redis.
      const ratingChangeA = 0;
      const ratingChangeB = 0;
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

  /**
   * 获取最近活跃的评估模块（用于恢复）
   */
  public async getRecentActiveModules(hoursBack: number = 24): Promise<Array<{ teamId: string; moduleId: string }>> {
    try {
      const cutoffTime = new Date();
      cutoffTime.setHours(cutoffTime.getHours() - hoursBack);

      const modules = await this.dataSource
        .createQueryBuilder(EvaluationBattleEntity, 'battle')
        .select('battle.evaluationModuleId', 'moduleId')
        .addSelect('module.teamId', 'teamId')
        .innerJoin(EvaluationModuleEntity, 'module', 'module.id = battle.evaluationModuleId')
        .where('battle.completedAt >= :cutoffTime', { cutoffTime })
        .distinct(true)
        .getRawMany();

      return modules;
    } catch (error) {
      this.logger.error('Error getting recent active modules:', error);
      return [];
    }
  }

  /**
   * 获取有资产的评估模块（备用恢复策略）
   */
  public async getModulesWithAssets(): Promise<Array<{ teamId: string; moduleId: string }>> {
    try {
      const modules = await this.dataSource
        .createQueryBuilder(EvaluationModuleEntity, 'module')
        .select('module.id', 'moduleId')
        .addSelect('module.teamId', 'teamId')
        .where('module.participantAssetIds IS NOT NULL')
        .andWhere('JSONB_ARRAY_LENGTH(module.participantAssetIds) > 1') // PostgreSQL JSONB数组长度函数
        .getRawMany();

      return modules;
    } catch (error) {
      this.logger.error('Error getting modules with assets:', error);
      return [];
    }
  }

  /**
   * 生成排行榜HTML文件
   */
  async generateLeaderboardHtml(
    teamId: string,
    moduleId: string,
    module: EvaluationModuleEntity,
    options: {
      minRating?: number;
      maxRating?: number;
      limit?: number;
      minBattles?: number;
    },
  ): Promise<string> {
    try {
      // 使用OpenSkill服务获取排行榜数据
      const leaderboardResponse = await this.openskillService.getLeaderboard(teamId, moduleId, 1, options.limit || 1000);
      let leaderboardData = leaderboardResponse.items;

      // 应用评分过滤
      if (options.minRating !== undefined || options.maxRating !== undefined) {
        leaderboardData = leaderboardData.filter((item) => {
          if (options.minRating !== undefined && item.rating < options.minRating) return false;
          if (options.maxRating !== undefined && item.rating > options.maxRating) return false;
          return true;
        });
      }

      // 应用最少对战数过滤
      if (options.minBattles !== undefined) {
        leaderboardData = leaderboardData.filter((item) => item.totalBattles >= options.minBattles);
      }

      // 重新计算排名（因为过滤后排名可能不连续）
      leaderboardData = leaderboardData.map((item, index) => ({
        ...item,
        rank: index + 1,
      }));

      // 批量获取图片信息
      const assetIds = leaderboardData.map((item) => item.assetId);
      const mediaFiles = await this.mediaFileService.getMediaByIds(assetIds);
      const mediaMap = new Map(mediaFiles.map((media) => [media.id, media]));

      // 生成HTML内容
      const html = this.buildHtmlTemplate(module, leaderboardData, mediaMap, options);

      return html;
    } catch (error) {
      this.logger.error(`Error generating leaderboard HTML for module ${moduleId}:`, error);
      throw new Error('Failed to generate HTML export');
    }
  }

  /**
   * 生成排行榜CSV文件
   */
  async generateLeaderboardCsv(teamId: string, moduleId: string, module: EvaluationModuleEntity, options: { includeImageUrls?: boolean }): Promise<string> {
    try {
      // 使用OpenSkill服务获取排行榜数据
      const leaderboardResponse = await this.openskillService.getLeaderboard(teamId, moduleId, 1, 1000);
      const leaderboardData = leaderboardResponse.items;

      // 批量获取图片信息（如果需要）
      const assetIds = leaderboardData.map((item) => item.assetId);
      const mediaFiles = options.includeImageUrls ? await this.mediaFileService.getMediaByIds(assetIds) : [];
      const mediaMap = new Map(mediaFiles.map((media) => [media.id, media]));

      // 生成CSV内容
      const csv = this.buildCsvContent(leaderboardData, mediaMap, options.includeImageUrls);

      return csv;
    } catch (error) {
      this.logger.error(`Error generating leaderboard CSV for module ${moduleId}:`, error);
      throw new Error('Failed to generate CSV export');
    }
  }

  /**
   * 构建HTML模板
   */
  private buildHtmlTemplate(module: EvaluationModuleEntity, items: any[], mediaMap: Map<string, any>, options: any): string {
    const timestamp = new Date().toLocaleString('zh-CN');
    const ratingFilter = options.minRating || options.maxRating ? ` (评分区间: ${options.minRating || '不限'} - ${options.maxRating || '不限'})` : '';

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>评测排行榜 - ${module.displayName}</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0; padding: 20px; background-color: #f5f5f5;
        }
        .header { 
            background: white; padding: 20px; margin-bottom: 20px; 
            border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header h1 { margin: 0 0 10px 0; color: #333; }
        .header .meta { color: #666; font-size: 14px; }
        
        .table-container { 
            background: white; border-radius: 8px; 
            box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden;
        }
        table { 
            width: 100%; border-collapse: collapse; 
        }
        thead { background-color: #f8f9fa; }
        th, td { 
            padding: 12px; text-align: center; 
            border-bottom: 1px solid #dee2e6;
        }
        th { font-weight: 600; color: #495057; }
        
        .rank-cell { font-weight: bold; color: #007bff; }
        .rank-1 { background-color: #ffd700; color: #000; }
        .rank-2 { background-color: #c0c0c0; color: #000; }
        .rank-3 { background-color: #cd7f32; color: #fff; }
        
        .image-cell img { 
            width: 120px; height: 120px; 
            object-fit: cover; border-radius: 6px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }
        .image-cell .placeholder {
            width: 120px; height: 120px; 
            background: #e9ecef; border-radius: 6px;
            display: flex; align-items: center; justify-content: center;
            color: #6c757d; font-size: 12px;
        }
        
        .rating-cell { font-weight: bold; font-size: 16px; }
        .mu-cell { color: #6c757d; font-family: monospace; }
        .sigma-cell { color: #6c757d; font-family: monospace; }
        .battles-cell { color: #28a745; }
        
        tbody tr:hover { background-color: #f8f9fa; }
        
        .footer {
            margin-top: 20px; text-align: center; 
            color: #6c757d; font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${module.displayName}</h1>
        <div class="meta">
            <div>评测描述: ${module.description || '无'}</div>
            <div>导出时间: ${timestamp}</div>
            <div>数据范围: 共 ${items.length} 条记录${ratingFilter}</div>
        </div>
    </div>
    
    <div class="table-container">
        <table>
            <thead>
                <tr>
                    <th>排名</th>
                    <th>参与者（图片）</th>
                    <th>评分</th>
                    <th>Mu (μ)</th>
                    <th>Sigma (σ)</th>
                    <th>对战数</th>
                </tr>
            </thead>
            <tbody>
                ${items
                  .map((item) => {
                    const media = mediaMap.get(item.assetId);
                    const rankClass = item.rank <= 3 ? `rank-${item.rank}` : '';

                    return `
                    <tr>
                        <td class="rank-cell ${rankClass}">#${item.rank}</td>
                        <td class="image-cell">
                            ${media ? `<img src="${media.publicUrl || media.url}" alt="${media.displayName || item.assetId}" loading="lazy">` : `<div class="placeholder">图片不可用</div>`}
                            <div style="margin-top: 8px; font-size: 12px; text-align: center; word-break: break-all;">
                                ${media?.displayName || item.assetId}
                            </div>
                        </td>
                        <td class="rating-cell">${Math.round(item.rating)}</td>
                        <td class="mu-cell">${item.mu ? item.mu.toFixed(2) : 'N/A'}</td>
                        <td class="sigma-cell">${item.sigma ? item.sigma.toFixed(2) : 'N/A'}</td>
                        <td class="battles-cell">${item.totalBattles}</td>
                    </tr>
                  `;
                  })
                  .join('')}
            </tbody>
        </table>
    </div>
    
    <div class="footer">
        Generated by Evaluation System - ${timestamp}
    </div>
</body>
</html>`;
  }

  /**
   * 优化的排行榜数据获取方法（一次性获取所有需要的数据）
   */
  private async getOptimizedLeaderboardData(
    teamId: string,
    moduleId: string,
    options: {
      minRating?: number;
      maxRating?: number;
      limit?: number;
      minBattles?: number;
      includeImageUrls?: boolean;
    } = {},
  ): Promise<any[]> {
    try {
      const appId = config.server.appId;

      // 构建过滤条件
      const conditions: string[] = [];
      const parameters: any[] = [moduleId];
      let paramIndex = 2;

      if (options.minRating !== undefined) {
        conditions.push(`lr.rating_after >= $${paramIndex}`);
        parameters.push(options.minRating);
        paramIndex++;
      }

      if (options.maxRating !== undefined) {
        conditions.push(`lr.rating_after <= $${paramIndex}`);
        parameters.push(options.maxRating);
        paramIndex++;
      }

      if (options.minBattles !== undefined && options.minBattles > 0) {
        conditions.push(`COALESCE(bs.total_battles, 0) >= $${paramIndex}`);
        parameters.push(options.minBattles);
        paramIndex++;
      }

      const whereClause = conditions.length > 0 ? `AND ${conditions.join(' AND ')}` : '';
      const limitClause = options.limit ? `LIMIT $${paramIndex}` : '';
      if (options.limit) {
        parameters.push(options.limit);
      }

      // 使用原生SQL一次性获取所有数据（正确处理多租户表名）
      const query = `
        WITH latest_ratings AS (
          SELECT DISTINCT ON (asset_id) 
            asset_id, 
            mu_after, 
            sigma_after, 
            rating_after, 
            created_timestamp
          FROM "${appId}_evaluation_rating_history" 
          WHERE evaluation_module_id = $1 
          ORDER BY asset_id, created_timestamp DESC
        ),
        battle_stats AS (
          SELECT 
            asset_id,
            SUM(wins) as wins,
            SUM(losses) as losses, 
            SUM(draws) as draws,
            SUM(wins + losses + draws) as total_battles
          FROM (
            SELECT 
              asset_a_id as asset_id,
              CASE WHEN result = 'A_WIN' THEN 1 ELSE 0 END as wins,
              CASE WHEN result = 'B_WIN' THEN 1 ELSE 0 END as losses,
              CASE WHEN result = 'DRAW' THEN 1 ELSE 0 END as draws
            FROM "${appId}_evaluation_battles" 
            WHERE evaluation_module_id = $1 AND result IS NOT NULL
            UNION ALL 
            SELECT 
              asset_b_id as asset_id,
              CASE WHEN result = 'B_WIN' THEN 1 ELSE 0 END as wins,
              CASE WHEN result = 'A_WIN' THEN 1 ELSE 0 END as losses,
              CASE WHEN result = 'DRAW' THEN 1 ELSE 0 END as draws
            FROM "${appId}_evaluation_battles" 
            WHERE evaluation_module_id = $1 AND result IS NOT NULL
          ) battle_results 
          GROUP BY asset_id
        )
        SELECT 
          lr.asset_id,
          lr.rating_after as rating,
          lr.sigma_after as sigma,
          lr.mu_after as mu,
          COALESCE(bs.total_battles, 0) as total_battles,
          COALESCE(bs.wins, 0) as wins,
          COALESCE(bs.losses, 0) as losses,
          COALESCE(bs.draws, 0) as draws,
          lr.created_timestamp as last_updated,
          ROW_NUMBER() OVER (ORDER BY lr.rating_after DESC) as rank
        FROM latest_ratings lr 
        LEFT JOIN battle_stats bs ON lr.asset_id = bs.asset_id
        WHERE 1=1 ${whereClause}
        ORDER BY lr.rating_after DESC
        ${limitClause}
      `;

      const rawResults = await this.dataSource.query(query, parameters);

      // 转换为标准格式
      return rawResults.map((row: any) => ({
        rank: parseInt(row.rank),
        assetId: row.asset_id,
        rating: Math.round(parseFloat(row.rating) * 100) / 100,
        sigma: Math.round(parseFloat(row.sigma) * 100) / 100,
        mu: Math.round(parseFloat(row.mu) * 100) / 100,
        totalBattles: parseInt(row.total_battles) || 0,
        wins: parseInt(row.wins) || 0,
        losses: parseInt(row.losses) || 0,
        draws: parseInt(row.draws) || 0,
        lastUpdated: new Date(row.last_updated),
      }));
    } catch (error) {
      this.logger.error(`Error getting optimized leaderboard data for module ${moduleId}:`, error);
      throw new Error('Failed to get leaderboard data');
    }
  }

  /**
   * 构建CSV内容
   */
  private buildCsvContent(items: any[], mediaMap: Map<string, any>, includeImageUrls: boolean): string {
    // CSV头部
    const headers = ['排名', '参与者', '评分', 'Mu (μ)', 'Sigma (σ)', '对战数'];
    if (includeImageUrls) {
      headers.push('图片URL');
    }

    const csvLines = [headers.join(',')];

    // CSV数据行
    items.forEach((item) => {
      const media = mediaMap.get(item.assetId);
      const participantName = media?.displayName || item.assetId;

      const row = [item.rank, `"${participantName}"`, Math.round(item.rating), item.mu ? item.mu.toFixed(2) : 'N/A', item.sigma ? item.sigma.toFixed(2) : 'N/A', item.totalBattles];

      if (includeImageUrls) {
        row.push(`"${media ? media.publicUrl || media.url : ''}"`);
      }

      csvLines.push(row.join(','));
    });

    return csvLines.join('\n');
  }
}
