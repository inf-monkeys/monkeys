import { InstalledAppEntity } from '@/database/entities/marketplace/installed-app.entity';
import { MarketplaceAppVersionEntity } from '@/database/entities/marketplace/marketplace-app-version.entity';
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
  ) {}

  @OnEvent('marketplace.app.version.approved')
  async handleAppVersionApproved(payload: { appId: string; newVersionId: string }) {
    const { appId, newVersionId } = payload;
    this.logger.log(`New version approved for app ${appId}. Notifying existing installations.`);

    try {
      const allVersionsOfApp = await this.versionRepo.find({ where: { appId }, select: ['id'] });
      const allVersionIds = allVersionsOfApp.map((v) => v.id);

      const installationsToUpdate = await this.installedAppRepo.find({
        where: {
          marketplaceAppVersionId: In(allVersionIds.filter((id) => id !== newVersionId)),
          isUpdateAvailable: false,
        },
        select: ['id'],
      });

      if (installationsToUpdate.length > 0) {
        const idsToUpdate = installationsToUpdate.map((install) => install.id);

        this.logger.log(`Found ${idsToUpdate.length} installations to notify for app ${appId}.`);

        await this.installedAppRepo.createQueryBuilder().update(InstalledAppEntity).set({ isUpdateAvailable: true }).whereInIds(idsToUpdate).execute();

        this.logger.log(`Successfully notified ${idsToUpdate.length} installations.`);
      } else {
        this.logger.log(`No active installations found needing an update notification for app ${appId}.`);
      }
    } catch (error) {
      this.logger.error(`Failed to handle 'marketplace.app.version.approved' event for appId: ${appId}`, error.stack);
    }
  }
}
