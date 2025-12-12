import { generateDbId, getComfyuiWorkflowDataListFromWorkflow } from '@/common/utils';
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
import { WorkflowBuiltinPinnedPageEntity } from '@/database/entities/workflow/workflow-builtin-pinned-page';
import { WorkflowPageGroupEntity } from '@/database/entities/workflow/workflow-page-group';
import { WorkflowMetadataEntity } from '@/database/entities/workflow/workflow-metadata';
import { AssetsCommonRepository } from '@/database/repositories/assets-common.repository';
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
    private readonly assetsCommonRepository: AssetsCommonRepository,
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
   * 确保 workflow 中引用的 comfyui 工作流在应用市场中已经存在对应的应用。
   * 如果不存在，则自动为这些 comfyui workflow 创建应用并审批通过（但不会标记为预置应用）。
   *
   * 这样在后续为 workflow 创建内置应用时，WorkflowCrudService.getSnapshot
   * 中解析 comfyui 依赖就不会因为缺少对应的 comfyui-workflow 应用而报 404。
   */
  private async ensureComfyuiDependenciesPublished(workflow: WorkflowMetadataEntity) {
    const tasks: any[] = (workflow as any)?.tasks || [];
    if (!tasks.length) {
      return;
    }

    const comfyuiDataList = getComfyuiWorkflowDataListFromWorkflow(tasks);
    if (!comfyuiDataList.length) {
      return;
    }

    const comfyuiWorkflowIds = Array.from(
      new Set(
        comfyuiDataList
          .map((item) => item.comfyuiWorkflowId)
          .filter((id): id is string => typeof id === 'string' && !!id),
      ),
    );

    if (!comfyuiWorkflowIds.length) {
      return;
    }

    const teamId = workflow.teamId;
    const userId = workflow.creatorUserId || 'system';

    for (const comfyuiWorkflowId of comfyuiWorkflowIds) {
      // 如果已经存在应用，则跳过
      const existsAppVersion = await this.marketplaceService.getAppVersionByAssetId(comfyuiWorkflowId, 'comfyui-workflow');
      if (existsAppVersion?.app) {
        continue;
      }

      const appId = comfyuiWorkflowId; // 与 comfyui workflow 资产一一对应

      this.logger.debug(
        `Create marketplace app for comfyui workflow dependency ${comfyuiWorkflowId} in team ${teamId} (appId=${appId})`,
      );

      const dto = {
        app: {
          name: appId,
          // comfyui workflow 本身的描述与图标在 snapshot 中处理；这里保持简单配置
          description: undefined,
          iconUrl: undefined,
          assetType: 'comfyui-workflow' as const,
          categories: [] as string[],
        },
        version: {
          version: '1.0.0',
          releaseNotes: 'Created automatically for builtin workflow comfyui dependency',
          assets: [
            {
              assetType: 'comfyui-workflow' as const,
              assetId: comfyuiWorkflowId,
              // comfyui-workflow 当前未使用版本号，这里填入固定值即可
              version: 1,
            },
          ],
        },
      };

      await this.marketplaceService.createAppWithVersion(teamId, userId, dto as any);

      // 审批通过，但不标记为预置应用；由引用它的 workflow 控制是否预置
      await this.marketplaceService.approveSubmission(appId);
    }
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
   * @param categories 可选的分类数组，如果不提供或为空，则使用 ['默认']
   * @param teamId 可选的团队 ID（已废弃，系统会为所有团队创建分类筛选规则）
   */
  async setWorkflowAsBuiltinApp(workflowId: string, categories?: string[], teamId?: string) {
    // 1. 尝试根据 workflowId 在应用市场中查找对应的 App 版本
    const existsAppVersion = await this.marketplaceService.getAppVersionByAssetId(workflowId, 'workflow');

    // 处理分类：如果没有提供或为空，则使用 ['默认']
    const finalCategories = categories && categories.length > 0 ? categories : ['默认'];
    const finalGroupKey = finalCategories[0] ?? null;

    if (existsAppVersion?.app) {
      const appId = existsAppVersion.app.id;

      // 更新应用的分类
      await this.entityManager.update(MarketplaceAppEntity, { id: appId }, { categories: finalCategories });

      // 为所有团队创建对应的 AssetFilterEntity
      await this.createAssetFiltersForAllTeams(finalCategories);

      // 同步更新全局内置 pinned 视图的 groupKey（用于工作台分组展示）
      await this.entityManager.update(
        WorkflowBuiltinPinnedPageEntity,
        { workflowId, isDeleted: false },
        { groupKey: finalGroupKey, updatedTimestamp: Date.now() },
      );

      // 确保所有团队存在对应的工作台分组（避免回落到默认）
      // 为所有分类都创建工作台分组
      for (const category of finalCategories) {
        if (category && category !== '默认') {
          await this.ensureWorkbenchGroupForAllTeams(category);
        }
      }

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

    // 2.1 先确保 workflow 中引用的 comfyui 工作流已经在应用市场中存在应用
    //     避免在后续生成 snapshot 时，因为缺少 comfyui-workflow 应用而导致 404
    await this.ensureComfyuiDependenciesPublished(workflow);

    const workflowTeamId = workflow.teamId;
    const userId = workflow.creatorUserId || 'system';
    const version = workflow.version;

    const appId = workflowId; // 使用 workflowId 作为 appId/name，保证一一对应

    const dto = {
      app: {
        name: appId,
        description: typeof workflow.description === 'string' ? workflow.description : undefined,
        iconUrl: workflow.iconUrl,
        assetType: 'workflow' as const,
        categories: finalCategories,
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

    await this.marketplaceService.createAppWithVersion(workflowTeamId, userId, dto as any);

    // 3. 审批并标记为预置应用
    await this.marketplaceService.approveSubmission(appId, true);

    // 4. 将应用标记为预置应用（isPreset = true），并为所有团队安装最新版本
    const result = await this.marketplaceService.setPreset(appId, true);

    // 5. 为所有团队创建对应的 AssetFilterEntity
    await this.createAssetFiltersForAllTeams(finalCategories);

    // 6. 确保所有团队存在对应的工作台分组
    // 为所有分类都创建工作台分组
    for (const category of finalCategories) {
      if (category && category !== '默认') {
        await this.ensureWorkbenchGroupForAllTeams(category);
      }
    }

    return {
      appId,
      ...result,
      builtin: true,
      created: true,
    };
  }

  /**
   * 为所有团队创建指定分类的 AssetFilterEntity
   * @param categories 分类数组
   */
  private async createAssetFiltersForAllTeams(categories: string[]) {
    if (!categories || categories.length === 0) {
      return;
    }

    // 获取所有团队
    const teams = await this.teamRepository.getAllTeams();
    this.logger.debug(`Creating asset filters for ${teams.length} teams with categories: ${categories.join(', ')}`);

    for (const team of teams) {
      for (const categoryName of categories) {
        try {
          // 检查是否已存在同名的筛选规则
          const existingRules = await this.assetsCommonRepository.listFilters(team.id, 'workflow');
          const existingRule = existingRules.find((rule) => rule.name === categoryName);

          if (!existingRule) {
            // 1. 查找或创建同名的 tag
            let tagId: string | undefined;
            const existingTags = await this.assetsCommonRepository.getTagsByName(team.id, categoryName);

            if (existingTags.length > 0) {
              // 使用已存在的 tag
              tagId = existingTags[0].id;
              this.logger.debug(`Found existing tag '${categoryName}' (${tagId}) for team ${team.id}`);
            } else {
              // 创建新的 tag
              const newTag = await this.assetsCommonRepository.createTag(team.id, categoryName);
              tagId = newTag.id;
              this.logger.debug(`Created new tag '${categoryName}' (${tagId}) for team ${team.id}`);
            }

            // 2. 创建新的筛选规则，同时包含 marketplace 分类筛选和 tag 筛选
            await this.assetsCommonRepository.createAssetFilter(team.id, 'system', {
              name: categoryName,
              type: 'workflow',
              rules: {
                marketplaceCategories: [categoryName], // 筛选内置应用
                tagIds: tagId ? [tagId] : undefined,   // 筛选用户自己的工作流
              },
            });
            this.logger.debug(`Created asset filter '${categoryName}' for team ${team.id} with marketplace categories and tag ${tagId}`);
          } else {
            this.logger.debug(`Asset filter '${categoryName}' already exists for team ${team.id}`);
          }
        } catch (error) {
          this.logger.error(`Failed to create asset filter '${categoryName}' for team ${team.id}`, error.stack);
          // 继续处理其他团队，不中断整个过程
          continue;
        }
      }
    }
  }

  /**
   * 为所有团队确保存在指定名称的工作台分组
   * 仅在内置应用设置了非“默认”分类时调用
   */
  private async ensureWorkbenchGroupForAllTeams(groupKey: string) {
    const key = (groupKey || '').trim();
    if (!key || key === '默认') {
      return;
    }

    const teams = await this.teamRepository.getAllTeams();
    if (!teams || teams.length === 0) return;

    const teamIds = teams.map((t) => t.id);
    const allGroups = await this.entityManager.find(WorkflowPageGroupEntity, {
      where: {
        teamId: In(teamIds),
      },
    });

    const groupsByTeam: Record<string, WorkflowPageGroupEntity[]> = {};
    for (const g of allGroups) {
      (groupsByTeam[g.teamId] ||= []).push(g);
    }

    const normalizeGroupNames = (displayName?: string): string[] => {
      if (!displayName) return [];
      try {
        const parsed = JSON.parse(displayName);
        if (parsed && typeof parsed === 'object') {
          return Object.values(parsed).filter((v) => typeof v === 'string') as string[];
        }
      } catch {
        // ignore
      }
      return [displayName];
    };

    const now = Date.now();
    const toCreate: WorkflowPageGroupEntity[] = [];

    for (const team of teams) {
      const teamGroups = groupsByTeam[team.id] || [];
      const exists = teamGroups.some((g) => {
        if (g.presetRelationId === key) return true;
        return normalizeGroupNames(g.displayName)
          .map((n) => (n || '').trim())
          .includes(key);
      });

      if (!exists) {
        toCreate.push(
          this.entityManager.create(WorkflowPageGroupEntity, {
            id: generateDbId(),
            displayName: JSON.stringify({ 'zh-CN': key, 'en-US': key }),
            isBuiltIn: false,
            teamId: team.id,
            pageIds: [],
            createdTimestamp: now,
            updatedTimestamp: now,
          }),
        );
      }
    }

    if (toCreate.length > 0) {
      await this.entityManager.save(WorkflowPageGroupEntity, toCreate);
      this.logger.debug(`Created workbench page groups for ${toCreate.length} teams with key: ${key}`);
    }
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
