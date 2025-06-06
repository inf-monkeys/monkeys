import { ComfyuiModelModule } from '@/modules/assets/comfyui-model/comfyui-model.module';
import { ComfyuiModelService } from '@/modules/assets/comfyui-model/comfyui-model.service';
import { DesignMetadataService } from '@/modules/design/design.metadata.service';
import { DesignModule } from '@/modules/design/design.module';
import { DesignProjectService } from '@/modules/design/design.project.service';
import { ComfyUIModule } from '@/modules/tools/comfyui/comfyui.module';
import { ConductorModule } from '@/modules/workflow/conductor/conductor.module';
import { WorkflowModule } from '@/modules/workflow/workflow.module';
import { WorkflowPageService } from '@/modules/workflow/workflow.page.service';
import { Module } from '@nestjs/common';
import { TeamsController } from './teams.controller';
import { TeamsService } from './teams.service';

@Module({
  controllers: [TeamsController],
  providers: [TeamsService, ComfyuiModelService, DesignProjectService, DesignMetadataService, WorkflowPageService],
  imports: [ConductorModule, ComfyuiModelModule, ComfyUIModule, DesignModule, WorkflowModule],
  exports: [TeamsService],
})
export class TeamsModule {}
