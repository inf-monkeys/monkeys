import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, Repository } from 'typeorm';
import { BattleGroupEntity } from '../entities/evaluation/battle-group.entity';
import { EvaluationBattleEntity } from '../entities/evaluation/evaluation-battle.entity';
import { EvaluationModuleEntity } from '../entities/evaluation/evaluation-module.entity';
import { EvaluatorEntity, EvaluatorType } from '../entities/evaluation/evaluator.entity';
import { LeaderboardScoreEntity } from '../entities/evaluation/leaderboard-score.entity';
import { LeaderboardEntity } from '../entities/evaluation/leaderboard.entity';
import { ModuleEvaluatorEntity } from '../entities/evaluation/module-evaluator.entity';

@Injectable()
export class EvaluationRepository {
  constructor(
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
  ) {}

  // ============ EvaluationModule 相关方法 ============

  public saveEvaluationModule(evaluationModule: EvaluationModuleEntity, manager?: EntityManager): Promise<EvaluationModuleEntity> {
    const repository = manager ? manager.getRepository(EvaluationModuleEntity) : this.evaluationModuleRepository;
    return repository.save(evaluationModule);
  }

  public findEvaluationModuleById(id: string, manager?: EntityManager): Promise<EvaluationModuleEntity | null> {
    const repository = manager ? manager.getRepository(EvaluationModuleEntity) : this.evaluationModuleRepository;
    return repository.findOne({ where: { id } });
  }

  public async listEvaluationModules(teamId: string, page: number = 1, limit: number = 10, search?: string): Promise<{ list: EvaluationModuleEntity[]; totalCount: number }> {
    const queryBuilder = this.evaluationModuleRepository
      .createQueryBuilder('module')
      .where('module.teamId = :teamId', { teamId })
      .orderBy('module.createdTimestamp', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (search) {
      queryBuilder.andWhere('(module.displayName LIKE :search OR module.description LIKE :search)', { search: `%${search}%` });
    }

    const [list, totalCount] = await queryBuilder.getManyAndCount();
    return { list, totalCount };
  }

  // ============ Evaluator 相关方法 ============

  public saveEvaluator(evaluator: EvaluatorEntity, manager?: EntityManager): Promise<EvaluatorEntity> {
    const repository = manager ? manager.getRepository(EvaluatorEntity) : this.evaluatorRepository;
    return repository.save(evaluator);
  }

  public findEvaluatorById(id: string, manager?: EntityManager): Promise<EvaluatorEntity | null> {
    const repository = manager ? manager.getRepository(EvaluatorEntity) : this.evaluatorRepository;
    return repository.findOne({ where: { id } });
  }

  public async listEvaluators(page: number = 1, limit: number = 10, search?: string): Promise<{ list: EvaluatorEntity[]; totalCount: number }> {
    const queryBuilder = this.evaluatorRepository
      .createQueryBuilder('evaluator')
      .orderBy('evaluator.createdTimestamp', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (search) {
      queryBuilder.andWhere('evaluator.name ILIKE :search', { search: `%${search}%` });
    }

    const [list, totalCount] = await queryBuilder.getManyAndCount();
    return { list, totalCount };
  }

  public async getEvaluatorsByModule(evaluationModuleId: string, page: number = 1, limit: number = 10): Promise<{ list: EvaluatorEntity[]; totalCount: number }> {
    const queryBuilder = this.evaluatorRepository
      .createQueryBuilder('evaluator')
      .innerJoin('evaluator.moduleEvaluators', 'me')
      .where('me.evaluationModuleId = :moduleId', { moduleId: evaluationModuleId })
      .andWhere('me.isActive = :isActive', { isActive: true })
      .orderBy('evaluator.createdTimestamp', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [list, totalCount] = await queryBuilder.getManyAndCount();
    return { list, totalCount };
  }

  public async getActiveEvaluatorsByModule(evaluationModuleId: string, type?: EvaluatorType): Promise<EvaluatorEntity[]> {
    const queryBuilder = this.evaluatorRepository
      .createQueryBuilder('evaluator')
      .innerJoin('evaluator.moduleEvaluators', 'moduleEvaluator')
      .where('moduleEvaluator.evaluationModuleId = :evaluationModuleId', { evaluationModuleId })
      .andWhere('moduleEvaluator.isActive = :isActive', { isActive: true })
      .andWhere('evaluator.isActive = :isActive', { isActive: true });

    if (type) {
      queryBuilder.andWhere('evaluator.type = :type', { type });
    }

    return queryBuilder.getMany();
  }

  // ============ ModuleEvaluator 相关方法 ============

  public saveModuleEvaluator(moduleEvaluator: ModuleEvaluatorEntity, manager?: EntityManager): Promise<ModuleEvaluatorEntity> {
    const repository = manager ? manager.getRepository(ModuleEvaluatorEntity) : this.moduleEvaluatorRepository;
    return repository.save(moduleEvaluator);
  }

  // ============ Leaderboard 相关方法 ============

  public create(leaderboard: LeaderboardEntity, manager?: EntityManager): Promise<LeaderboardEntity> {
    const repository = manager ? manager.getRepository(LeaderboardEntity) : this.leaderboardRepository;
    return repository.save(leaderboard);
  }

  public findLeaderboardById(id: string, manager?: EntityManager): Promise<LeaderboardEntity | null> {
    const repository = manager ? manager.getRepository(LeaderboardEntity) : this.leaderboardRepository;
    return repository.findOne({ where: { id } });
  }

  public updateLeaderboard(leaderboard: LeaderboardEntity, manager?: EntityManager): Promise<LeaderboardEntity> {
    const repository = manager ? manager.getRepository(LeaderboardEntity) : this.leaderboardRepository;
    return repository.save(leaderboard);
  }

  public async deleteLeaderboard(leaderboardId: string): Promise<void> {
    await this.leaderboardRepository.delete(leaderboardId);
  }

  // ============ LeaderboardScore 相关方法 ============

  public findScoresByAssetIds(evaluationModuleId: string, assetIds: string[], manager?: EntityManager): Promise<LeaderboardScoreEntity[]> {
    const repository = manager ? manager.getRepository(LeaderboardScoreEntity) : this.scoreRepository;
    return repository.find({ where: { evaluationModuleId, assetId: In(assetIds) } });
  }

  public async getLeaderboardScores(evaluationModuleId: string, evaluatorId?: string, page: number = 1, limit: number = 10): Promise<{ list: LeaderboardScoreEntity[]; totalCount: number }> {
    const queryBuilder = this.scoreRepository.createQueryBuilder('score').where('score.evaluationModuleId = :evaluationModuleId', { evaluationModuleId });

    if (evaluatorId) {
      queryBuilder.andWhere('score.scoresByEvaluator ? :evaluatorId', { evaluatorId });
    }

    queryBuilder
      .orderBy("(score.scoresByEvaluator->:evaluatorId->>'rating')::float", 'DESC')
      .setParameter('evaluatorId', evaluatorId || 'default')
      .skip((page - 1) * limit)
      .take(limit);

    const [list, totalCount] = await queryBuilder.getManyAndCount();
    return { list, totalCount };
  }

  // ============ Battle 相关方法 ============

  public saveBattle(battle: EvaluationBattleEntity, manager?: EntityManager): Promise<EvaluationBattleEntity> {
    const repository = manager ? manager.getRepository(EvaluationBattleEntity) : this.battleRepository;
    return repository.save(battle);
  }

  public findBattleById(id: string, manager?: EntityManager): Promise<EvaluationBattleEntity | null> {
    const repository = manager ? manager.getRepository(EvaluationBattleEntity) : this.battleRepository;
    return repository.findOne({ where: { id } });
  }

  public createBattle(battle: EvaluationBattleEntity, manager?: EntityManager): Promise<EvaluationBattleEntity> {
    const repository = manager ? manager.getRepository(EvaluationBattleEntity) : this.battleRepository;
    return repository.save(battle);
  }

  public async getEvaluationModuleBattles(evaluationModuleId: string, page: number = 1, limit: number = 10): Promise<{ list: EvaluationBattleEntity[]; totalCount: number }> {
    const queryBuilder = this.battleRepository
      .createQueryBuilder('battle')
      .where('battle.evaluationModuleId = :evaluationModuleId', { evaluationModuleId })
      .orderBy('battle.createdTimestamp', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [list, totalCount] = await queryBuilder.getManyAndCount();
    return { list, totalCount };
  }

  // 此方法已迁移到 EvaluationRefactoredRepository
  public async countModuleBattles(): Promise<number> {
    throw new Error('This method has been migrated to EvaluationRefactoredRepository. Please use evaluationRefactoredRepository.countModuleBattles() instead.');
  }

  // 此方法已迁移到 EvaluationRefactoredRepository
  public async getRecentBattlesWithRatingChanges(): Promise<any[]> {
    throw new Error('This method has been migrated to EvaluationRefactoredRepository. Please use evaluationRefactoredRepository.getRecentBattlesWithRatingChanges() instead.');
  }

  // 此方法已迁移到 EvaluationRefactoredRepository
  public async getAssetRatingHistory(): Promise<any[]> {
    throw new Error('This method has been migrated to EvaluationRefactoredRepository. Please use evaluationRefactoredRepository.getAssetRatingHistory() instead.');
  }

  // 此方法已迁移到 EvaluationRefactoredRepository
  public async saveBattleAndScores(): Promise<void> {
    throw new Error('This method has been migrated to EvaluationRefactoredRepository. Please use evaluationRefactoredRepository.saveBattleAndScores() instead.');
  }

  // ============ BattleGroup 相关方法 ============

  public saveBattleGroup(battleGroup: BattleGroupEntity, manager?: EntityManager): Promise<BattleGroupEntity> {
    const repository = manager ? manager.getRepository(BattleGroupEntity) : this.battleGroupRepository;
    return repository.save(battleGroup);
  }

  public createBattleGroup(battleGroup: BattleGroupEntity, manager?: EntityManager): Promise<BattleGroupEntity> {
    const repository = manager ? manager.getRepository(BattleGroupEntity) : this.battleGroupRepository;
    return repository.save(battleGroup);
  }

  public findBattleGroupById(id: string, manager?: EntityManager): Promise<BattleGroupEntity | null> {
    const repository = manager ? manager.getRepository(BattleGroupEntity) : this.battleGroupRepository;
    return repository.findOne({ where: { id } });
  }

  public updateBattleGroup(battleGroup: BattleGroupEntity, manager?: EntityManager): Promise<BattleGroupEntity> {
    const repository = manager ? manager.getRepository(BattleGroupEntity) : this.battleGroupRepository;
    return repository.save(battleGroup);
  }

  public async findBattlesByGroupId(battleGroupId: string, status?: string, manager?: EntityManager): Promise<EvaluationBattleEntity[]> {
    const repository = manager ? manager.getRepository(EvaluationBattleEntity) : this.battleRepository;
    const queryBuilder = repository.createQueryBuilder('battle').where('battle.battleGroupId = :battleGroupId', { battleGroupId });

    if (status) {
      if (status === 'PENDING') {
        queryBuilder.andWhere('battle.result IS NULL');
      } else {
        queryBuilder.andWhere('battle.result IS NOT NULL');
      }
    }

    return queryBuilder.getMany();
  }

  public async getBattleGroupsByEvaluationModule(evaluationModuleId: string, page: number = 1, limit: number = 10): Promise<{ list: BattleGroupEntity[]; totalCount: number }> {
    const queryBuilder = this.battleGroupRepository
      .createQueryBuilder('battleGroup')
      .where('battleGroup.evaluationModuleId = :evaluationModuleId', { evaluationModuleId })
      .orderBy('battleGroup.createdTimestamp', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [list, totalCount] = await queryBuilder.getManyAndCount();
    return { list, totalCount };
  }
}
