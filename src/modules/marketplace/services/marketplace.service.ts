import { ListDto } from '@/common/dto/list.dto';
import { generateDbId } from '@/common/utils';
import { InstalledAppEntity } from '@/database/entities/marketplace/installed-app.entity';
import { MarketplaceAppVersionEntity, MarketplaceAppVersionStatus } from '@/database/entities/marketplace/marketplace-app-version.entity';
import { MarketplaceAppEntity, MarketplaceAppStatus } from '@/database/entities/marketplace/marketplace-app.entity';
import { ToolsRepository } from '@/database/repositories/tools.repository';
import { AssetsMapperService } from '@/modules/assets/assets.common.service';
import { WorkflowCrudService } from '@/modules/workflow/workflow.curd.service';
import { AssetType, MonkeyTaskDefTypes } from '@inf-monkeys/monkeys';
import { BadRequestException, forwardRef, Inject, Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { CreateMarketplaceAppWithVersionDto } from '../dto/create-app.dto';
import { UpdateMarketplaceAppDto } from '../dto/update-app.dto';
import { InstalledAssetInfo, MarketplaceAssetSnapshot, SourceAssetReference } from '../types';

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
    private readonly toolsRepository: ToolsRepository,
    private readonly eventEmitter: EventEmitter2,
    private readonly entityManager: EntityManager,
    @Inject(forwardRef(() => AssetsMapperService))
    private readonly assetsMapperService: AssetsMapperService,
  ) {}

  private async createTasksSnapshot(tasks: MonkeyTaskDefTypes[]): Promise<MonkeyTaskDefTypes[]> {
    return JSON.parse(JSON.stringify(tasks));
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
        const handler = this.assetsMapperService.getAssetHandler(assetRef.assetType);
        const snapshot = await handler.getSnapshot(assetRef.assetId, assetRef.version);

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

  public async approveSubmission(appId: string, isPreset?: boolean) {
    return this.entityManager.transaction(async (transactionalEntityManager) => {
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

      return app;
    });
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
    const { page = 1, limit = 10 } = dto;
    const [list, total] = await this.appRepo.findAndCount({
      where: { status: MarketplaceAppStatus.APPROVED },
      take: limit,
      skip: (page - 1) * limit,
      order: { updatedTimestamp: 'DESC' },
    });
    return { list, total };
  }

  public async listSubmissions(dto: ListDto) {
    const { page = 1, limit = 10 } = dto;
    const [list, total] = await this.appRepo.findAndCount({
      where: { status: MarketplaceAppStatus.PENDING_APPROVAL },
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
    const { page = 1, limit = 10 } = dto;
    const [list, total] = await this.appRepo.findAndCount({
      where: { authorTeamId: teamId },
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
    for (const app of presetApps.sort((a, b) => assetTypeInstallSort.indexOf(a.assetType) - assetTypeInstallSort.indexOf(b.assetType))) {
      await this.installApp(app.versions[0].id, teamId, userId);
    }
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
      });
      await transactionalEntityManager.save(installation);

      // 阶段四：更新应用的安装总数
      await transactionalEntityManager.increment(MarketplaceAppEntity, { id: version.appId }, 'totalInstalls', 1);

      this.eventEmitter.emit('marketplace.app.installed', { installationId: installation.id, teamId });

      return installation;
    });
  }

  public async getInstalledApps(teamId: string, userId: string) {
    const installedApps = await this.installedAppRepo.find({ where: { teamId, userId } });
    return installedApps;
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
    return this.appRepo.save(app);
  }
}
