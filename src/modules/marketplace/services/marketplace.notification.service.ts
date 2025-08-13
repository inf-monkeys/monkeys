import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { MarketplaceService } from './marketplace.service';

@Injectable()
export class MarketplaceNotificationService {
  private readonly logger = new Logger(MarketplaceNotificationService.name);

  constructor(private readonly marketplaceService: MarketplaceService) {}

  @OnEvent('marketplace.app.version.approved')
  async handleAppVersionApproved(payload: { appId: string; newVersionId: string }) {
    const { appId, newVersionId } = payload;
    this.logger.log(`New version approved for app ${appId}. Notifying existing installations.`);

    try {
      await this.marketplaceService.upgradeInstalledApp(appId, newVersionId);
    } catch (error) {
      this.logger.error(`Failed to handle 'marketplace.app.version.approved' event for appId: ${appId}`, error.stack);
    }
  }
}
