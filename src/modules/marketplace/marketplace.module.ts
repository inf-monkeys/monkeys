import { InstalledAppEntity } from '@/database/entities/marketplace/installed-app.entity';
import { MarketplaceAppVersionEntity } from '@/database/entities/marketplace/marketplace-app-version.entity';
import { MarketplaceAppEntity } from '@/database/entities/marketplace/marketplace-app.entity';
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetsModule } from '../assets/assets.module';
import { WorkflowModule } from '../workflow/workflow.module';
import { MarketplaceAdminController } from './controllers/marketplace.admin.controller';
import { MarketplacePublicController } from './controllers/marketplace.public.controller';
import { MarketplaceSubmissionController } from './controllers/marketplace.submission.controller';
import { MarketplaceNotificationService } from './services/marketplace.notification.service';
import { MarketplaceService } from './services/marketplace.service';

@Module({
  imports: [TypeOrmModule.forFeature([MarketplaceAppEntity, MarketplaceAppVersionEntity, InstalledAppEntity]), forwardRef(() => WorkflowModule), forwardRef(() => AssetsModule)],
  controllers: [MarketplaceAdminController, MarketplacePublicController, MarketplaceSubmissionController],
  providers: [MarketplaceService, MarketplaceNotificationService],
  exports: [MarketplaceService],
})
export class MarketplaceModule {}
