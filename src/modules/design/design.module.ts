import { Module } from '@nestjs/common';
import { DesignController } from './design.controller';
import { DesignMetadataService } from './design.metadata.service';
import { DesignProjectService } from './design.project.service';

@Module({
  controllers: [DesignController],
  providers: [DesignMetadataService, DesignProjectService],
  exports: [DesignMetadataService, DesignProjectService],
})
export class DesignModule {}
