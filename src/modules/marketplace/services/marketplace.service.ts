import { ListDto } from '@/common/dto/list.dto';
import { generateDbId } from '@/common/utils';
import { TeamEntity } from '@/database/entities/identity/team';
import { InstalledAppEntity } from '@/database/entities/marketplace/installed-app.entity';
import { MarketplaceAppVersionEntity, MarketplaceAppVersionStatus } from '@/database/entities/marketplace/marketplace-app-version.entity';
import { MarketplaceAppEntity, MarketplaceAppStatus } from '@/database/entities/marketplace/marketplace-app.entity';
import { PageInstanceType } from '@/database/entities/workflow/workflow-page';
import { ToolsRepository } from '@/database/repositories/tools.repository';
import { AssetsMapperService } from '@/modules/assets/assets.common.service';
import { WorkflowCrudService } from '@/modules/workflow/workflow.curd.service';
import { WorkflowPageService } from '@/modules/workflow/workflow.page.service';
import { AssetType, MonkeyTaskDefTypes } from '@inf-monkeys/monkeys';
import { BadRequestException, forwardRef, Inject, Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { omit, set, uniq } from 'lodash';
import { EntityManager, ILike, In, Repository } from 'typeorm';
import { CreateMarketplaceAppWithVersionDto } from '../dto/create-app.dto';
import { UpdateMarketplaceAppDto } from '../dto/update-app.dto';
import { InstalledAssetInfo, IStagedAsset, IStagedAssets, IStagedAssetWithSnapshot, MarketplaceAssetSnapshot, SourceAssetReference } from '../types';
import { marketplaceDataManager } from './marketplace.data';

@Injectable()
export class MarketplaceService {
  private readonly logger = new Logger(MarketplaceService.name);

  constructor(
    @InjectRepository(MarketplaceAppEntity)
    private readonly appRepo: Repository<MarketplaceAppEntity>,
    @InjectRepository(MarketplaceAppVersionEntity)
    private readonly versionRepo: Repository<MarketplaceAppVersionEntity>,
    @InjectRepository(InstalledAppEntity)
    private readonly installedAppRepo: Repository<InstalledAppEntity>,
    private readonly workflowCrudService: WorkflowCrudService,
    private readonly workflowPageService: WorkflowPageService,
    private readonly toolsRepository: ToolsRepository,
    private readonly eventEmitter: EventEmitter2,
    private readonly entityManager: EntityManager,
    @Inject(forwardRef(() => AssetsMapperService))
    private readonly assetsMapperService: AssetsMapperService,
  ) {}

  /**
   * 预置应用缓存（仅用于 workflow 内置应用相关的筛选逻辑），
   * 用来减少频繁调用 getPresetApps 带来的数据库压力。
   * 在 setPreset / initPresetAppMarketplace 等修改预置应用的操作后会被清空。
   */
  private presetAppsCache: MarketplaceAppEntity[] | null = null;

  private async getPresetAppsCached(): Promise<MarketplaceAppEntity[]> {
    if (!this.presetAppsCache) {
      this.presetAppsCache = await this.getPresetApps();
    }
    return this.presetAppsCache;
  }

  private async createTasksSnapshot(tasks: MonkeyTaskDefTypes[]): Promise<MonkeyTaskDefTypes[]> {
    return JSON.parse(JSON.stringify(tasks));
  }

  public async getAssetSnapshot(assetType: AssetType, assetId: string, assetVersion: number, externalAssetList?: IStagedAssets) {
    const handler = this.assetsMapperService.getAssetHandler(assetType);
    const snapshot = await handler.getSnapshot(assetId, assetVersion, externalAssetList);
    return snapshot;
  }

  public async getAssetSnapshotByStagedAssets(assets: IStagedAssets): Promise<(IStagedAsset & { snapshot: any })[]> {
    for (const asset of assets) {
      set(asset, 'snapshot', await this.getAssetSnapshot(asset.type, asset.id, asset.assetVersion, assets));
    }
    return assets as (IStagedAsset & { snapshot: any })[];
  }

  public async _createAppWithSnapshot(teamId: string, userId: string, body: IStagedAssetWithSnapshot, transactionalEntityManager: EntityManager) {
    const { appId, version, comments: releaseNotes, type: assetType, snapshot, assetVersion } = body;

    let app = await transactionalEntityManager.findOne(MarketplaceAppEntity, {
      where: { id: appId, authorTeamId: teamId },
    });

    if (!app) {
      this.logger.debug(`Create app ${appId} in team ${teamId}`);
      app = transactionalEntityManager.create(MarketplaceAppEntity, {
        id: appId,
        name: appId,
        authorTeamId: teamId,
        status: MarketplaceAppStatus.PENDING_APPROVAL,
        assetType,
      });
      await transactionalEntityManager.save(app);
    } else {
      this.logger.debug(`Update app ${appId} in team ${teamId}`);
      app.status = MarketplaceAppStatus.PENDING_APPROVAL;
      app.name = appId;
      app.authorTeamId = teamId;
      app.assetType = assetType;
      await transactionalEntityManager.save(app);
    }

    this.logger.debug('Delete all other current versions');
    const result = await transactionalEntityManager.delete(MarketplaceAppVersionEntity, { appId });
    this.logger.debug(`Delete all other current versions: ${result.affected}`);

    const assetSnapshot: MarketplaceAssetSnapshot = {};
    const versionId = generateDbId();

    if (!assetSnapshot[assetType]) {
      assetSnapshot[assetType] = [];
    }
    assetSnapshot[assetType].push(snapshot);

    this.logger.debug(`Create version ${version} for app ${appId}`);
    const newVersion = transactionalEntityManager.create(MarketplaceAppVersionEntity, {
      id: versionId,
      appId,
      version,
      releaseNotes,
      assetSnapshot,
      sourceAssetReferences: [
        {
          assetType,
          assetId: 'internal',
          version: assetVersion,
        },
      ],
      status: MarketplaceAppVersionStatus.ACTIVE,
    });

    this.logger.debug(`Save version ${version} for app ${appId}`);
    await transactionalEntityManager.save(newVersion);

    this.eventEmitter.emit('marketplace.app.submitted', { appId, versionId: newVersion.id });

    return { ...app, version: newVersion };
  }

  public async createAppWithSnapshot(teamId: string, userId: string, body: IStagedAssetWithSnapshot, transactionalEntityManager?: EntityManager) {
    return transactionalEntityManager
      ? await this._createAppWithSnapshot(teamId, userId, body, transactionalEntityManager)
      : this.entityManager.transaction(async (entityManager) => await this._createAppWithSnapshot(teamId, userId, body, entityManager));
  }

  public async createAppWithVersion(teamId: string, userId: string, body: CreateMarketplaceAppWithVersionDto) {
    const { app: appDto, version: versionDto } = body;

    return this.entityManager.transaction(async (transactionalEntityManager) => {
      let app = await transactionalEntityManager.findOne(MarketplaceAppEntity, {
        where: { name: appDto.name, authorTeamId: teamId },
      });

      if (!app) {
        app = transactionalEntityManager.create(MarketplaceAppEntity, {
          ...appDto,
          id: appDto.name,
          authorTeamId: teamId,
          status: MarketplaceAppStatus.PENDING_APPROVAL,
        });
        await transactionalEntityManager.save(app);
      } else {
        app.status = MarketplaceAppStatus.PENDING_APPROVAL;
        await transactionalEntityManager.save(app);
      }

      const assetSnapshot: MarketplaceAssetSnapshot = {};
      const sourceAssetReferences: SourceAssetReference[] = [];
      const versionId = generateDbId();

      for (const assetRef of versionDto.assets) {
        const snapshot = await this.getAssetSnapshot(assetRef.assetType, assetRef.assetId, assetRef.version);

        if (!assetSnapshot[assetRef.assetType]) {
          assetSnapshot[assetRef.assetType] = [];
        }
        assetSnapshot[assetRef.assetType].push(snapshot);

        sourceAssetReferences.push(assetRef);
        if (assetRef.assetType === 'workflow') {
          this.workflowCrudService.updateWorkflowDef(teamId, assetRef.assetId, assetRef.version, {
            forkFromId: versionId,
          });
        }
      }

      const newVersion = transactionalEntityManager.create(MarketplaceAppVersionEntity, {
        id: versionId,
        appId: app.id,
        version: versionDto.version,
        releaseNotes: versionDto.releaseNotes,
        assetSnapshot,
        sourceAssetReferences,
        status: MarketplaceAppVersionStatus.ACTIVE,
      });

      await transactionalEntityManager.save(newVersion);

      this.eventEmitter.emit('marketplace.app.submitted', { appId: app.id, versionId: newVersion.id });

      return { ...app, version: newVersion };
    });
  }

  public async resubmitRejectedApp(teamId: string, userId: string, appId: string, body: CreateMarketplaceAppWithVersionDto) {
    const app = await this.appRepo.findOne({ where: { id: appId, authorTeamId: teamId } });
    if (!app) {
      throw new NotFoundException(`Application with id ${appId} not found or you are not the author.`);
    }
    if (app.status !== MarketplaceAppStatus.REJECTED) {
      throw new BadRequestException('Only rejected applications can be resubmitted.');
    }

    if (body.app.name !== app.name) {
      throw new BadRequestException('Resubmission app name must match the original app name.');
    }

    return this.createAppWithVersion(teamId, userId, body);
  }

  public async _approveSubmission(appId: string, transactionalEntityManager: EntityManager, isPreset?: boolean) {
    this.logger.debug(`Approve submission ${appId}`);
    const app = await transactionalEntityManager.findOne(MarketplaceAppEntity, { where: { id: appId } });
    if (!app) throw new NotFoundException('Application for approval not found.');

    app.status = MarketplaceAppStatus.APPROVED;
    app.isPreset = isPreset;
    await transactionalEntityManager.save(app);

    const latestVersion = await transactionalEntityManager.findOne(MarketplaceAppVersionEntity, {
      where: { appId },
      order: { createdTimestamp: 'DESC' },
    });

    if (latestVersion) {
      this.eventEmitter.emit('marketplace.app.version.approved', {
        appId: app.id,
        newVersionId: latestVersion.id,
      });
    }

    this.logger.debug(`Approve submission ${appId} completed`);

    return app;
  }

  public async approveSubmission(appId: string, isPreset?: boolean, transactionalEntityManager?: EntityManager) {
    return transactionalEntityManager
      ? await this._approveSubmission(appId, transactionalEntityManager, isPreset)
      : this.entityManager.transaction(async (entityManager) => await this._approveSubmission(appId, entityManager, isPreset));
  }

  public async rejectSubmission(appId: string) {
    const app = await this.appRepo.findOne({ where: { id: appId } });
    if (!app) throw new NotFoundException(`Application with id ${appId} not found`);
    if (app.status !== MarketplaceAppStatus.PENDING_APPROVAL) {
      throw new BadRequestException('Only pending applications can be rejected');
    }
    app.status = MarketplaceAppStatus.REJECTED;
    return this.appRepo.save(app);
  }

  public async listApprovedApps(dto: ListDto) {
    const { page = 1, limit = 10, search } = dto;
    const searchText = typeof search === 'string' ? search.trim() : '';
    const where = searchText
      ? [
          { status: MarketplaceAppStatus.APPROVED, name: ILike(`%${searchText}%`) },
          { status: MarketplaceAppStatus.APPROVED, description: ILike(`%${searchText}%`) },
        ]
      : { status: MarketplaceAppStatus.APPROVED };
    const [list, total] = await this.appRepo.findAndCount({
      where,
      take: limit,
      skip: (page - 1) * limit,
      order: { updatedTimestamp: 'DESC' },
    });
    return { list, total };
  }

  public async listSubmissions(dto: ListDto) {
    const { page = 1, limit = 10, search } = dto;
    const searchText = typeof search === 'string' ? search.trim() : '';
    const where = searchText
      ? [
          { status: MarketplaceAppStatus.PENDING_APPROVAL, name: ILike(`%${searchText}%`) },
          { status: MarketplaceAppStatus.PENDING_APPROVAL, description: ILike(`%${searchText}%`) },
        ]
      : { status: MarketplaceAppStatus.PENDING_APPROVAL };
    const [list, total] = await this.appRepo.findAndCount({
      where,
      take: limit,
      skip: (page - 1) * limit,
      order: { updatedTimestamp: 'DESC' },
    });
    return { list, total };
  }

  public async updateSubmission(appId: string, updates: UpdateMarketplaceAppDto) {
    const app = await this.appRepo.findOne({ where: { id: appId } });
    if (!app) throw new NotFoundException('Application not found.');
    if (app.status !== MarketplaceAppStatus.PENDING_APPROVAL) {
      throw new BadRequestException('Only pending applications can be updated.');
    }

    app.name = updates.name ?? app.name;
    app.description = updates.description ?? app.description;
    app.iconUrl = updates.iconUrl ?? app.iconUrl;
    app.categories = updates.categories ?? app.categories;
    app.updatedTimestamp = new Date().getTime();

    return this.appRepo.save(app);
  }

  public async getAllCategories(): Promise<string[]> {
    const apps = await this.appRepo.find({
      select: ['categories'],
      where: { status: MarketplaceAppStatus.APPROVED },
    });

    const allCategories = apps.flatMap((app) => app.categories || []);
    return [...new Set(allCategories)];
  }

  public async listDeveloperSubmissions(teamId: string, dto: ListDto) {
    const { page = 1, limit = 10, search } = dto;
    const searchText = typeof search === 'string' ? search.trim() : '';
    const where = searchText
      ? [
          { authorTeamId: teamId, name: ILike(`%${searchText}%`) },
          { authorTeamId: teamId, description: ILike(`%${searchText}%`) },
        ]
      : { authorTeamId: teamId };
    const [list, total] = await this.appRepo.findAndCount({
      where,
      take: limit,
      skip: (page - 1) * limit,
      order: { updatedTimestamp: 'DESC' },
      relations: ['versions'],
    });
    return { list, total };
  }

  public async archiveApp(teamId: string, appId: string): Promise<MarketplaceAppEntity> {
    const app = await this.appRepo.findOne({ where: { id: appId } });
    if (!app) {
      throw new NotFoundException(`Application with id ${appId} not found.`);
    }
    if (app.authorTeamId !== teamId) {
      throw new UnauthorizedException('You are not the author of this application.');
    }

    if (app.status !== MarketplaceAppStatus.APPROVED && app.status !== MarketplaceAppStatus.REJECTED) {
      throw new BadRequestException('Only approved or rejected applications can be archived.');
    }

    app.status = MarketplaceAppStatus.ARCHIVED;
    return this.appRepo.save(app);
  }

  public async getAppDetails(appId: string) {
    const app = await this.appRepo.findOne({
      where: {
        id: appId,
        status: MarketplaceAppStatus.APPROVED,
      },
    });

    if (!app) {
      throw new NotFoundException(`Application with id ${appId} not found or is not approved.`);
    }

    const appWithVersions = await this.appRepo.findOne({
      where: { id: appId },
      relations: {
        versions: true,
      },
    });

    return appWithVersions;
  }

  public async getPresetApps() {
    return this.appRepo.find({
      where: { isPreset: true, status: MarketplaceAppStatus.APPROVED, isDeleted: false },
      relations: { versions: true },
      order: {
        versions: {
          createdTimestamp: 'DESC',
        },
      },
    });
  }

  public async installPresetApps(teamId: string, userId: string) {
    const assetTypeInstallSort: AssetType[] = ['comfyui-workflow', 'workflow', 'design-association', 'workflow-association'];

    const presetApps = await this.getPresetApps();
    if (!presetApps) throw new NotFoundException('Preset app not found.');
    const installedApps: { installation: InstalledAppEntity; appVersion: MarketplaceAppVersionEntity }[] = [];

    for (const app of presetApps.sort((a, b) => assetTypeInstallSort.indexOf(a.assetType) - assetTypeInstallSort.indexOf(b.assetType))) {
      // 检查是否已安装该应用
      const latestVersion = app.versions[0];
      set(latestVersion, 'app', omit(app, 'versions'));
      const existingInstallation = await this.getInstalledAppByAppId(app.id, teamId);

      let shouldInstallNew = true;
      let currentInstallation: InstalledAppEntity = null;

      if (existingInstallation) {
        // 检查安装的资产是否还存在
        let assetsExist = true;
        for (const [assetType, assetIds] of Object.entries(existingInstallation.installedAssetIds)) {
          const handler = this.assetsMapperService.getAssetHandler(assetType as any);
          // 检查每个资产是否存在
          for (const assetId of assetIds) {
            try {
              const asset = await handler.getById(assetId, teamId);
              if (!asset) {
                this.logger.warn(`Asset ${assetId} of type ${assetType} not found in team ${teamId}, will reinstall app`);
                assetsExist = false;
                break;
              }
            } catch (error) {
              this.logger.error(`Failed to check asset ${assetId} existence`, error.stack);
              assetsExist = false;
              break;
            }
          }
          if (!assetsExist) break;
        }

        if (assetsExist) {
          // 如果资产都存在，尝试更新到最新版本
          shouldInstallNew = false;
          // 更新后重新获取安装信息
          currentInstallation = await this.upgradeSpecificInstalledApp(app.id, latestVersion, existingInstallation);
          installedApps.push({
            installation: currentInstallation,
            appVersion: latestVersion,
          });
        } else {
          // 如果有资产不存在，删除旧的安装记录
          await this.installedAppRepo.delete(existingInstallation.id);
        }
      }

      if (shouldInstallNew) {
        // 执行新安装
        this.logger.log(`Installing new app ${app.id} for team ${teamId}`);
        const installedApp = await this.installApp(latestVersion.id, teamId, userId);
        installedApps.push(installedApp);
      }
    }

    // 按照 preset app sort 对 workflow page 进行分组和排序
    const installedWorkflowApps = installedApps.filter((app) => app.appVersion.app.assetType === 'workflow');

    this.logger.debug(`Installed workflow apps: ${installedWorkflowApps.length}`);

    // 根据 preset app sort 进行映射
    const appIdToPageIdMapper = new Map<string, Record<PageInstanceType, string>>();
    for (const app of installedWorkflowApps) {
      // 获取 pages 列表
      const pages = await this.workflowPageService.listWorkflowPages(app.installation.installedAssetIds.workflow[0]);
      const formmatedPages = pages.reduce(
        (acc, page) => {
          acc[page.type] = page.id;
          return acc;
        },
        {} as Record<PageInstanceType, string>,
      );
      appIdToPageIdMapper.set(app.appVersion.app.id, formmatedPages);
    }

    const presetPageGroupMapper = new Map<string, string>();

    // 遍历 preset app sort 的 page group
    for (const presetPageGroup of marketplaceDataManager.presetAppSort) {
      // 获取当前团队下的 group id
      const pageGroup = await this.workflowPageService.getPageGroupByPresetId(teamId, presetPageGroup.id);

      presetPageGroupMapper.set(presetPageGroup.id, pageGroup.id);

      // sort
      // 规则是 preset 的顺序 + 现有的顺序
      const pageIds: string[] = uniq([...presetPageGroup.pages.map((presetPage) => appIdToPageIdMapper.get(presetPage.appId)?.[presetPage.pageType]).filter(Boolean), ...pageGroup.pageIds]);

      await this.workflowPageService.updatePageGroup(teamId, pageGroup.id, {
        pageIds,
        mode: 'set',
      });

      // 获取原本顺序
      const originPageGroupIds = (await this.workflowPageService.getPageGroups(teamId)).map((it) => it.id);

      // 然后 sort page group
      const presetMapToPageGroupIds = marketplaceDataManager.presetAppSort.map((it) => presetPageGroupMapper.get(it.id)).filter(Boolean);

      // 在 preset 中的排前面，不在的保持原顺序
      const pageGroupIds = originPageGroupIds.sort((a, b) => presetMapToPageGroupIds.indexOf(a) - presetMapToPageGroupIds.indexOf(b));

      this.logger.debug(`Page group ids: ${pageGroupIds}`);

      await this.workflowPageService.updatePageGroupSort(teamId, pageGroupIds);
    }

    return;
  }

  public async installApp(versionId: string, teamId: string, userId: string) {
    return this.entityManager.transaction(async (transactionalEntityManager) => {
      const version = await transactionalEntityManager.findOne(MarketplaceAppVersionEntity, {
        where: { id: versionId, status: MarketplaceAppVersionStatus.ACTIVE },
        relations: ['app'],
      });

      if (!version || version.app.status !== MarketplaceAppStatus.APPROVED) {
        throw new NotFoundException(`App version ${versionId} not found or the app is not approved for installation.`);
      }

      if (!version.assetSnapshot || Object.keys(version.assetSnapshot).length === 0) {
        throw new BadRequestException('Cannot install app: asset snapshot is empty or invalid.');
      }

      const installedAssetIds: InstalledAssetInfo = {};
      const idMapping: { [originalId: string]: string } = {};

      // 阶段一：克隆所有资产并建立ID映射表
      for (const assetType in version.assetSnapshot) {
        if (Object.prototype.hasOwnProperty.call(version.assetSnapshot, assetType)) {
          this.logger.debug(`Phase 1: Cloning assets of type: ${assetType}`);
          const assets = version.assetSnapshot[assetType];

          for (const assetData of assets) {
            const handler = this.assetsMapperService.getAssetHandler(assetType as any);
            const { originalId, newId } = await handler.cloneFromSnapshot(assetData, teamId, userId);
            idMapping[originalId] = newId;

            if (!installedAssetIds[assetType]) {
              installedAssetIds[assetType] = [];
            }
            installedAssetIds[assetType].push(newId);
          }
        }
      }

      // 阶段二：依赖重映射
      this.logger.debug(`Phase 2: Remapping dependencies with mapping table: ${JSON.stringify(idMapping)}`);
      for (const assetType in installedAssetIds) {
        const handler = this.assetsMapperService.getAssetHandler(assetType as any);
        if (handler.remapDependencies) {
          for (const newId of installedAssetIds[assetType]) {
            await handler.remapDependencies(newId, idMapping);
          }
        }
      }

      // 阶段三：创建安装记录
      const installation = transactionalEntityManager.create(InstalledAppEntity, {
        id: generateDbId(),
        teamId,
        userId,
        installedAssetIds,
        marketplaceAppVersionId: version.id,
        isUpdateAvailable: false,
        marketplaceAppId: version.app.id,
      });
      await transactionalEntityManager.save(installation);

      // 阶段四：更新应用的安装总数
      await transactionalEntityManager.increment(MarketplaceAppEntity, { id: version.appId }, 'totalInstalls', 1);

      this.eventEmitter.emit('marketplace.app.installed', { installationId: installation.id, teamId });

      // // 阶段五：如果在 preset apps 里面，进行一个 page pin & sort
      // if (presetAllAppIds.includes(version.app.id)) {
      //   this.logger.debug(`Phase 5: Pin & sort page for preset app ${version.app.id}`);
      //   const pageGroupPresetList = presetAppSort.filter((it) => it.pages.some((page) => page.appId === version.app.id));
      //   for (const pageGroupPreset of pageGroupPresetList) {
      //     await this.workflowPageService.createPageGroup(teamId, pageGroupPreset.id);
      //   }
      // }

      return {
        installation,
        appVersion: version,
      };
    });
  }

  public async getInstalledApps(teamId: string, userId: string) {
    const installedApps = await this.installedAppRepo.find({ where: { teamId, userId } });
    return installedApps;
  }

  public async getInstalledAppByAppId(appId: string, teamId: string) {
    const installedApp = await this.installedAppRepo.findOne({
      where: {
        marketplaceAppId: appId,
        teamId,
      },
    });
    return installedApp;
  }

  public async getInstalledAppByAppVersionId(appVersionId: string, teamId: string) {
    const installedApp = await this.installedAppRepo.findOne({
      where: {
        marketplaceAppVersionId: appVersionId,
        teamId,
      },
      order: {
        createdTimestamp: 'DESC', // 按创建时间倒序排列，获取最新的
      },
    });
    return installedApp;
  }

  public async getInstalledAppVersionIdByAssetId(assetId: string, assetType: AssetType) {
    const appVersionId = await this.installedAppRepo.findOne({ where: { installedAssetIds: { [assetType]: [assetId] } } });
    return appVersionId;
  }

  /**
   * 获取某个应用在所有团队中安装出来的 workflowId 列表
   * 仅针对 workflow 类型资产，用于作者团队在执行记录中汇总所有映射实例
   */
  public async getInstalledWorkflowIdsByAppId(appId: string): Promise<string[]> {
    const latestVersion = await this.getAppLatestVersion(appId);
    if (!latestVersion) {
      return [];
    }

    const installations = await this.installedAppRepo.find({
      where: {
        marketplaceAppVersionId: latestVersion.id,
      },
    });

    const workflowIds: string[] = [];
    for (const inst of installations) {
      const wfIds = inst.installedAssetIds?.workflow || [];
      workflowIds.push(...wfIds);
    }

    return workflowIds;
  }

  public async getAppVersionByAssetId(assetId: string, assetType: AssetType) {
    const appVersion = await this.versionRepo
      .createQueryBuilder('version')
      .leftJoinAndSelect('version.app', 'app')
      .where(
        `
      EXISTS (
        SELECT 1
        FROM jsonb_array_elements(version.sourceAssetReferences) AS elem
        WHERE elem->>'assetId' = :assetId
          AND elem->>'assetType' = :assetType
      )
    `,
        {
          assetId,
          assetType,
        },
      )
      .getOne();
    return appVersion;
  }

  public async getAppVersionById(appVersionId: string) {
    const appVersion = await this.versionRepo.findOne({ where: { id: appVersionId }, relations: { app: true } });
    return appVersion;
  }

  public async setPreset(appId: string, isPreset: boolean) {
    const app = await this.appRepo.findOne({ where: { id: appId } });
    if (!app) throw new NotFoundException('Application not found.');
    app.isPreset = isPreset;
    const updatedApp = await this.appRepo.save(app);
    // 预置应用状态发生变化时清空缓存
    this.presetAppsCache = null;
    if (isPreset) {
      const installResult = await this.installAppLatestVersionToAllTeams(appId);
      return { ...updatedApp, installResult };
    }
    return updatedApp;
  }

  public async getAppLatestVersion(appId: string) {
    const appVersion = await this.versionRepo.findOne({
      where: { appId },
      order: { createdTimestamp: 'DESC' },
      relations: { app: true },
    });
    return appVersion;
  }

  public async installAppLatestVersionToAllTeams(appId: string) {
    // 使用事务来确保所有操作的原子性
    return this.entityManager.transaction(async (transactionalEntityManager) => {
      // 1. 获取应用的最新版本
      const latestVersion = await this.getAppLatestVersion(appId);
      if (!latestVersion) {
        throw new NotFoundException(`No version found for app ${appId}`);
      }

      /**
       * 对于 workflow 类型的应用，我们希望「内置应用」在资产层面是共享的：
       * - 不再为每个团队克隆一份 workflow 资产
       * - 其他团队通过统一的 workflowId + teamId 上下文来使用同一条工作流
       *
       * 因此这里对 workflow 资产类型直接跳过实际安装逻辑，仅返回一个统计结果。
       * 其他资产类型（如 comfyui-workflow、design-association 等）仍保持原有的克隆安装行为。
       */
      if (latestVersion.app.assetType === 'workflow') {
        this.logger.debug(
          `Skip cloning workflow assets for preset app ${appId}, workflows will be shared across teams by workflowId.`,
        );
        return {
          totalTeams: 0,
          failedInstallations: [],
        };
      }

      // 2. 获取所有团队，排除已安装此应用的团队
      const teamsWithoutApp = await transactionalEntityManager
        .createQueryBuilder(TeamEntity, 'team')
        .where((qb) => {
          const subQuery = qb
            .subQuery()
            .select('installed.teamId')
            .from(InstalledAppEntity, 'installed')
            .where('installed.marketplaceAppVersionId = :versionId', { versionId: latestVersion.id })
            .getQuery();
          return 'team.id NOT IN ' + subQuery;
        })
        .andWhere('team.isDeleted = :isDeleted', { isDeleted: false })
        // 不再对应用作者团队重复安装，避免在作者团队里多出一份克隆的工作流资产
        .andWhere('team.id != :authorTeamId', { authorTeamId: latestVersion.app.authorTeamId })
        .getMany();

      this.logger.debug(`Found ${teamsWithoutApp.length} teams without the app installed`);

      // 3. 为每个团队安装应用
      const failedInstallations = [];
      for (const team of teamsWithoutApp) {
        try {
          // 使用团队所有者作为安装者
          await this.installApp(latestVersion.id, team.id, team.ownerUserId);
          this.logger.debug(`Successfully installed app for team ${team.id}`);
        } catch (error) {
          this.logger.error(`Failed to install app for team ${team.id}:`, error);
          failedInstallations.push(team.id);
          // 继续处理其他团队，不中断整个过程
          continue;
        }
      }

      return {
        totalTeams: teamsWithoutApp.length,
        failedInstallations,
      };
    });
  }

  /**
   * 获取当前租户中所有被标记为预置（内置应用）的 workflow 对应的 workflowId 列表。
   *
   * 设计说明：
   * - 以 MarketplaceAppEntity 为中心，筛选 isPreset = true 且 assetType = 'workflow' 的应用
   * - 对每个应用，取最新版本（versions[0] 已按 createdTimestamp DESC 排序）
   * - 从 sourceAssetReferences 中提取 assetType = 'workflow' 的 assetId 作为 workflowId
   * - 返回去重后的 workflowId 列表
   */
  public async getBuiltinWorkflowIds(): Promise<string[]> {
    const presetApps = await this.getPresetAppsCached();
    const builtinWorkflowIds = new Set<string>();

    for (const app of presetApps) {
      if (app.assetType !== 'workflow') continue;
      const latestVersion = app.versions?.[0];
      if (!latestVersion) continue;

      const refs = latestVersion.sourceAssetReferences || [];
      for (const ref of refs) {
        if (ref.assetType === 'workflow' && ref.assetId) {
          builtinWorkflowIds.add(ref.assetId);
        }
      }
    }

    return Array.from(builtinWorkflowIds);
  }

  /**
   * 获取由指定团队作为作者（authorTeamId）的所有预置 workflow 的 workflowId 列表。
   *
   * 主要用于作者团队快速筛选「本团队被设置为内置应用」的工作流。
   */
  public async getBuiltinWorkflowIdsByAuthorTeam(teamId: string): Promise<string[]> {
    const presetApps = await this.getPresetAppsCached();
    const builtinWorkflowIds = new Set<string>();

    for (const app of presetApps) {
      if (app.assetType !== 'workflow') continue;
      if (app.authorTeamId !== teamId) continue;
      const latestVersion = app.versions?.[0];
      if (!latestVersion) continue;

      const refs = latestVersion.sourceAssetReferences || [];
      for (const ref of refs) {
        if (ref.assetType === 'workflow' && ref.assetId) {
          builtinWorkflowIds.add(ref.assetId);
        }
      }
    }

    return Array.from(builtinWorkflowIds);
  }

  public async initPresetAppMarketplace() {
    if (marketplaceDataManager.presetAppLocalDataList.length === 0) {
      this.logger.log('No internal preset apps need to be initialized.');
      return;
    }

    this.logger.log(`${marketplaceDataManager.presetAppLocalDataList.length} apps need to be initialized.`);

    // 进入事务
    return this.entityManager.transaction(async (transactionalEntityManager) => {
      // 清空所有 preset
      this.logger.log('Clear all preset apps in database');
      // await this.appRepo.update({ isPreset: true, isDeleted: false }, { isPreset: false });
      await transactionalEntityManager.update(MarketplaceAppEntity, { isPreset: true, isDeleted: false }, { isPreset: false });

      // 从文件 snapshot 更新数据库 snapshot & approve
      this.logger.log('Update all preset apps from local data');
      for (const [index, presetAppLocalData] of marketplaceDataManager.presetAppLocalDataList.entries()) {
        this.logger.log(`${index + 1}/${marketplaceDataManager.presetAppLocalDataList.length}`);
        await this.createAppWithSnapshot('system', 'system', presetAppLocalData, transactionalEntityManager);
        await this.approveSubmission(presetAppLocalData.appId, true, transactionalEntityManager);
      }

      // 预置应用整体刷新后，清空缓存
      this.presetAppsCache = null;
    });
  }

  public async upgradeInstalledApp(appId: string, newVersionId: string) {
    this.logger.log(`Upgrading installations for app ${appId} to version ${newVersionId}`);

    try {
      const allVersionsOfApp = await this.versionRepo.find({ where: { appId }, select: ['id'] });
      const allVersionIds = allVersionsOfApp.map((v) => v.id);

      // 获取需要更新的安装记录的完整信息
      const installationsToUpdate = await this.installedAppRepo.find({
        where: {
          marketplaceAppVersionId: In(allVersionIds.filter((id) => id !== newVersionId)),
          isUpdateAvailable: false,
        },
      });

      if (installationsToUpdate.length > 0) {
        const idsToUpdate = installationsToUpdate.map((install) => install.id);
        this.logger.log(`Found ${idsToUpdate.length} installations to update for app ${appId}.`);

        // 获取新版本的 asset_snapshot
        const newVersion = await this.versionRepo.findOne({
          where: { id: newVersionId },
        });

        if (!newVersion || !newVersion.assetSnapshot) {
          throw new Error('New version or its asset snapshot not found');
        }

        // 为每个安装进行更新
        for (const installation of installationsToUpdate) {
          this.logger.log(`Updating installation ${installation.id} for team ${installation.teamId}`);

          // 遍历每种资产类型
          for (const assetType in newVersion.assetSnapshot) {
            if (!installation.installedAssetIds[assetType]) {
              continue;
            }

            const newAssets = newVersion.assetSnapshot[assetType];
            const installedAssets = installation.installedAssetIds[assetType];

            // 确保数组长度匹配
            if (newAssets.length !== installedAssets.length) {
              this.logger.warn(`Asset count mismatch for type ${assetType} in installation ${installation.id}`);
              continue;
            }

            // 更新每个资产
            for (let i = 0; i < installedAssets.length; i++) {
              const installedAssetId = installedAssets[i];
              const handler = this.assetsMapperService.getAssetHandler(assetType as any);
              try {
                await handler.updateFromSnapshot(newAssets[i], installation.teamId, installation.userId, installedAssetId);
              } catch (error) {
                this.logger.error(`Failed to update asset ${installedAssetId} for type ${assetType} in installation ${installation.id}`, error.stack);
              }
            }
          }

          // 更新安装记录的版本ID
          installation.marketplaceAppVersionId = newVersionId;
          installation.isUpdateAvailable = false;
          installation.marketplaceAppId = appId;
          await this.installedAppRepo.save(installation);

          this.logger.log(`Successfully updated installation ${installation.id}`);
        }

        this.logger.log(`Successfully updated ${idsToUpdate.length} installations.`);
      } else {
        this.logger.log(`No active installations found needing an update for app ${appId}.`);
      }
    } catch (error) {
      this.logger.error(`Failed to upgrade installations for app ${appId}`, error.stack);
      throw error;
    }
  }

  public async upgradeSpecificInstalledApp(appId: string, newVersion: MarketplaceAppVersionEntity, installation: InstalledAppEntity) {
    this.logger.log(`Updating installation ${installation.id} for team ${installation.teamId}`);

    // 遍历每种资产类型
    for (const assetType in newVersion.assetSnapshot) {
      if (!installation.installedAssetIds[assetType]) {
        continue;
      }

      const newAssets = newVersion.assetSnapshot[assetType];
      const installedAssets = installation.installedAssetIds[assetType];

      // 确保数组长度匹配
      if (newAssets.length !== installedAssets.length) {
        this.logger.warn(`Asset count mismatch for type ${assetType} in installation ${installation.id}`);
        continue;
      }

      // 更新每个资产
      for (let i = 0; i < installedAssets.length; i++) {
        const installedAssetId = installedAssets[i];
        const handler = this.assetsMapperService.getAssetHandler(assetType as any);
        try {
          await handler.updateFromSnapshot(newAssets[i], installation.teamId, installation.userId, installedAssetId);
        } catch (error) {
          this.logger.error(`Failed to update asset ${installedAssetId} for type ${assetType} in installation ${installation.id}`, error.stack);
        }
      }
    }

    // 更新安装记录的版本ID
    installation.marketplaceAppVersionId = newVersion.id;
    installation.isUpdateAvailable = false;
    installation.marketplaceAppId = appId;
    const updatedInstallation = await this.installedAppRepo.save(installation);

    this.logger.log(`Successfully updated installation ${updatedInstallation.id}`);

    return updatedInstallation;
  }
}
