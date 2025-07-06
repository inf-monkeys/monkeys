import { InstalledAppEntity } from '@/database/entities/marketplace/installed-app.entity';
import { MarketplaceAppVersionEntity } from '@/database/entities/marketplace/marketplace-app-version.entity';
import { AssetsMapperService } from '@/modules/assets/assets.common.service';
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

@Injectable()
export class MarketplaceNotificationService {
  private readonly logger = new Logger(MarketplaceNotificationService.name);

  constructor(
    @InjectRepository(InstalledAppEntity)
    private readonly installedAppRepo: Repository<InstalledAppEntity>,
    @InjectRepository(MarketplaceAppVersionEntity)
    private readonly versionRepo: Repository<MarketplaceAppVersionEntity>,
    private readonly assetsMapperService: AssetsMapperService,
  ) {}

  @OnEvent('marketplace.app.version.approved')
  async handleAppVersionApproved(payload: { appId: string; newVersionId: string }) {
    const { appId, newVersionId } = payload;
    this.logger.log(`New version approved for app ${appId}. Notifying existing installations.`);

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
        this.logger.log(`Found ${idsToUpdate.length} installations to notify for app ${appId}.`);

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
          await this.installedAppRepo.save(installation);

          this.logger.log(`Successfully updated installation ${installation.id}`);
        }

        this.logger.log(`Successfully updated ${idsToUpdate.length} installations.`);
      } else {
        this.logger.log(`No active installations found needing an update notification for app ${appId}.`);
      }
    } catch (error) {
      this.logger.error(`Failed to handle 'marketplace.app.version.approved' event for appId: ${appId}`, error.stack);
    }
  }
}
