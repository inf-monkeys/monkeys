import { ApiKeyEntity } from '@/database/entities/apikey/apikey';
import { BaseEntity } from '@/database/entities/base/base';
import { DesignAssociationEntity } from '@/database/entities/design/design-association';
import { DesignMetadataEntity } from '@/database/entities/design/design-metatdata';
import { DesignProjectEntity } from '@/database/entities/design/design-project';
import { EvaluationTaskEntity } from '@/database/entities/evaluation/evaluation-task.entity';
import { TeamEntity } from '@/database/entities/identity/team';
import { InstalledAppEntity } from '@/database/entities/marketplace/installed-app.entity';
import { MarketplaceAppEntity } from '@/database/entities/marketplace/marketplace-app.entity';
import { WorkflowObservabilityEntity } from '@/database/entities/observability/workflow-observability';
import { WorkflowMetadataEntity } from '@/database/entities/workflow/workflow-metadata';
import { TeamRepository } from '@/database/repositories/team.repository';
import { WorkflowRepository } from '@/database/repositories/workflow.repository';
import { MarketplaceService } from '@/modules/marketplace/services/marketplace.service';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EntityManager, EntityTarget, FindOptionsWhere, In } from 'typeorm';
import { TeamsService } from '../auth/teams/teams.service';

const assetEntities = [ApiKeyEntity, WorkflowMetadataEntity, WorkflowObservabilityEntity, DesignProjectEntity, DesignMetadataEntity, DesignAssociationEntity, InstalledAppEntity, EvaluationTaskEntity];

@Injectable()
export class TenantManageService {
  private readonly logger = new Logger(TenantManageService.name);

  // 添加进度订阅管理
  private progressSubscribers = new Map<string, (progress: any) => void>();

  constructor(
    private readonly teamRepository: TeamRepository,
    private readonly teamsService: TeamsService,
    private readonly workflowRepository: WorkflowRepository,
    private readonly marketplaceService: MarketplaceService,
    private readonly entityManager: EntityManager,
  ) {}

  async _delete(entity: EntityTarget<BaseEntity>, where: FindOptionsWhere<BaseEntity & { teamId?: string }>, transactionalEntityManager?: EntityManager, soft = true) {
    if (soft) {
      return transactionalEntityManager
        ? await transactionalEntityManager.update(entity, where, {
            isDeleted: true,
          })
        : this.entityManager.transaction(async (entityManager) => {
            return await entityManager.update(entity, where, {
              isDeleted: true,
            });
          });
    } else {
      return transactionalEntityManager
        ? await transactionalEntityManager.delete(entity, where)
        : this.entityManager.transaction(async (entityManager) => {
            return await entityManager.delete(entity, where);
          });
    }
  }

  async deleteAllTeamsExceptDefault(soft = true) {
    this.logger.log('Starting to delete all teams except default');
    return this.entityManager.transaction(async (transactionalEntityManager) => {
      // 先获取所有要删除的团队ID
      const teamsToDelete = await transactionalEntityManager.find(TeamEntity, {
        where: {
          isBuiltIn: false,
        },
        select: ['id'],
      });

      this.logger.log(`Found ${teamsToDelete.length} teams to delete`);

      const teamIds = teamsToDelete.map((team) => team.id);

      if (teamIds.length === 0) {
        return;
      }

      await transactionalEntityManager.update(
        MarketplaceAppEntity,
        {
          authorTeamId: In(teamIds),
        },
        {
          authorTeamId: 'system',
        },
      );

      for (const entity of assetEntities) {
        this.logger.debug(`Deleting ${entity.name} for teams ${teamIds.join(', ')}`);
        await this._delete(
          entity,
          {
            teamId: In(teamIds),
          },
          transactionalEntityManager,
          soft,
        );
      }

      await this._delete(
        TeamEntity,
        {
          id: In(teamIds),
        },
        transactionalEntityManager,
        soft,
      );

      this.logger.log('All teams deleted');
    });
  }

  async initAllTeams(deleteAllAssets = false) {
    this.logger.log('Starting to init all teams');
    const teams = await this.teamRepository.getAllTeams();
    this.logger.log(`Found ${teams.length} teams to init`);
    for (const team of teams) {
      this.logger.debug(`Init team ${team.id}`);
      await this.teamsService.initTeam(team.id, team.ownerUserId, deleteAllAssets);
    }
    this.logger.log('All teams initialized');
  }

  async initAllTeamsWithProgress(deleteAllAssets = false, onProgress?: (progress: any) => void) {
    this.logger.log('Starting to init all teams with progress tracking');

    const teams = await this.teamRepository.getAllTeams();
    const total = teams.length;

    this.logger.log(`Found ${total} teams to init`);

    let current = 0;

    for (const team of teams) {
      current++;
      this.logger.debug(`Init team ${team.id} (${current}/${total})`);

      // 发送进度更新
      if (onProgress) {
        onProgress({
          status: 'processing',
          message: `正在初始化团队: ${team.name || team.id}`,
          progress: Math.round((current / total) * 100),
          total,
          current,
          currentTeam: {
            id: team.id,
            name: team.name,
          },
        });
      }

      try {
        await this.teamsService.initTeam(team.id, team.ownerUserId, deleteAllAssets);

        // 发送成功状态
        if (onProgress) {
          onProgress({
            status: 'processing',
            message: `团队 ${team.name || team.id} 初始化成功`,
            progress: Math.round((current / total) * 100),
            total,
            current,
            currentTeam: {
              id: team.id,
              name: team.name,
              status: 'success',
            },
          });
        }
      } catch (error) {
        this.logger.error(`Failed to init team ${team.id}:`, error);

        // 发送错误状态
        if (onProgress) {
          onProgress({
            status: 'processing',
            message: `团队 ${team.name || team.id} 初始化失败: ${error.message}`,
            progress: Math.round((current / total) * 100),
            total,
            current,
            currentTeam: {
              id: team.id,
              name: team.name,
              status: 'error',
              error: error.message,
            },
          });
        }
      }
    }

    this.logger.log('All teams initialized');
  }

  /**
   * 将指定 workflow 对应的应用市场应用设置为预置应用（内置应用），并自动安装到所有团队。
   *
   * 要求：
   * - 调用方通过 TenantStatisticsAuthGuard 使用租户级 Bearer Token 鉴权
   * - 该 workflow 需要已经通过应用市场提交流程创建过应用（存在 sourceAssetReferences 记录）
   *   如果尚未创建，会自动为该 workflow 创建一个应用、审批并设置为预置应用。
   *
   * @param workflowId 工作流 ID（workflowId，而非数据库主键）
   */
  async setWorkflowAsBuiltinApp(workflowId: string) {
    // 1. 尝试根据 workflowId 在应用市场中查找对应的 App 版本
    const existsAppVersion = await this.marketplaceService.getAppVersionByAssetId(workflowId, 'workflow');

    if (existsAppVersion?.app) {
      const appId = existsAppVersion.app.id;
      // 如果已经是预置应用，则直接返回，不重复安装
      if (existsAppVersion.app.isPreset) {
        return {
          appId,
          builtin: true,
          created: false,
          alreadyBuiltin: true,
        };
      }

      const result = await this.marketplaceService.setPreset(appId, true);
      return {
        appId,
        ...result,
        builtin: true,
        created: false,
      };
    }

    // 2. 如果不存在应用，则自动为该 workflow 创建一个应用并提交审核
    const workflow = await this.workflowRepository.getWorkflowByIdWithoutVersion(workflowId);
    if (!workflow) {
      throw new NotFoundException(`工作流 ${workflowId} 不存在`);
    }

    const teamId = workflow.teamId;
    const userId = workflow.creatorUserId || 'system';
    const version = workflow.version;

    const appId = workflowId; // 使用 workflowId 作为 appId/name，保证一一对应

    const dto = {
      app: {
        name: appId,
        description: typeof workflow.description === 'string' ? workflow.description : undefined,
        iconUrl: workflow.iconUrl,
        assetType: 'workflow' as const,
        categories: [] as string[],
      },
      version: {
        version: '1.0.0',
        releaseNotes: 'Created as builtin app via tenant manage API',
        assets: [
          {
            assetType: 'workflow' as const,
            assetId: workflowId,
            version,
          },
        ],
      },
    };

    await this.marketplaceService.createAppWithVersion(teamId, userId, dto as any);

    // 3. 审批并标记为预置应用
    await this.marketplaceService.approveSubmission(appId, true);

    // 4. 将应用标记为预置应用（isPreset = true），并为所有团队安装最新版本
    const result = await this.marketplaceService.setPreset(appId, true);

    return {
      appId,
      ...result,
      builtin: true,
      created: true,
    };
  }

  /**
   * 查询 workflow 是否已经被设置为内置应用
   */
  async getWorkflowBuiltinStatus(workflowId: string) {
    const appVersion = await this.marketplaceService.getAppVersionByAssetId(workflowId, 'workflow');
    return {
      appId: appVersion?.app?.id,
      builtin: !!appVersion?.app?.isPreset,
    };
  }

  /**
   * 取消 workflow 对应应用的预置（内置）状态
   */
  async unsetWorkflowBuiltinApp(workflowId: string) {
    const appVersion = await this.marketplaceService.getAppVersionByAssetId(workflowId, 'workflow');
    if (!appVersion?.app) {
      return {
        appId: null,
        builtin: false,
        changed: false,
      };
    }
    const appId = appVersion.app.id;
    const result = await this.marketplaceService.setPreset(appId, false);
    return {
      appId,
      ...result,
      builtin: false,
      changed: true,
    };
  }

  // 进度订阅管理方法
  subscribeToProgress(taskId: string, callback: (progress: any) => void) {
    this.progressSubscribers.set(taskId, callback);

    return () => {
      this.progressSubscribers.delete(taskId);
    };
  }

  // 发布进度更新
  private publishProgress(taskId: string, progress: any) {
    const callback = this.progressSubscribers.get(taskId);
    if (callback) {
      callback(progress);
    }
  }
}
