import { forwardRef, Module } from '@nestjs/common';
import { MarketplaceModule } from '../marketplace/marketplace.module';
import { WorkflowModule } from '../workflow/workflow.module';
import { DesignThumbnailService } from './design-thumbnail.service';
import { DesignAssociationCrudService } from './design.association.crud.service';
import { DesignAssociationService } from './design.association.service';
import { DesignController } from './design.controller';
import { DesignMetadataService } from './design.metadata.service';
import { DesignProjectService } from './design.project.service';

@Module({
  imports: [forwardRef(() => WorkflowModule), forwardRef(() => MarketplaceModule)],
  controllers: [DesignController],
  providers: [DesignMetadataService, DesignProjectService, DesignAssociationService, DesignAssociationCrudService, DesignThumbnailService],
  exports: [DesignMetadataService, DesignProjectService, DesignAssociationService, DesignAssociationCrudService, DesignThumbnailService],
})
export class DesignModule {}
