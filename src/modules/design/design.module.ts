import { Module } from '@nestjs/common';
import { DesignAssociationService } from './design.association.service';
import { DesignController } from './design.controller';
import { DesignMetadataService } from './design.metadata.service';
import { DesignProjectService } from './design.project.service';

@Module({
  controllers: [DesignController],
  providers: [DesignMetadataService, DesignProjectService, DesignAssociationService],
  exports: [DesignMetadataService, DesignProjectService, DesignAssociationService],
})
export class DesignModule {}
