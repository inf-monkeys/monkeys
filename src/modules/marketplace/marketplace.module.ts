import { InstalledAppEntity } from '@/database/entities/marketplace/installed-app.entity';
import { MarketplaceAppVersionEntity } from '@/database/entities/marketplace/marketplace-app-version.entity';
import { MarketplaceAppEntity } from '@/database/entities/marketplace/marketplace-app.entity';
import { WorkflowPageEntity } from '@/database/entities/workflow/workflow-page';
import { WorkflowPageGroupEntity } from '@/database/entities/workflow/workflow-page-group';
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetsModule } from '../assets/assets.module';
import { DesignModule } from '../design/design.module';
import { WorkflowModule } from '../workflow/workflow.module';
import { MarketplaceAdminController } from './controllers/marketplace.admin.controller';
import { MarketplacePublicController } from './controllers/marketplace.public.controller';
import { MarketplaceSubmissionController } from './controllers/marketplace.submission.controller';
import { MarketplaceTeamController } from './controllers/marketplace.team.controller';
import { MarketplaceNotificationService } from './services/marketplace.notification.service';
import { MarketplaceService } from './services/marketplace.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([MarketplaceAppEntity, MarketplaceAppVersionEntity, InstalledAppEntity, WorkflowPageEntity, WorkflowPageGroupEntity]),
    forwardRef(() => WorkflowModule),
    forwardRef(() => AssetsModule),
    forwardRef(() => DesignModule),
  ],
  controllers: [MarketplaceAdminController, MarketplacePublicController, MarketplaceSubmissionController, MarketplaceTeamController],
  providers: [MarketplaceService, MarketplaceNotificationService],
  exports: [MarketplaceService],
})
export class MarketplaceModule {}
