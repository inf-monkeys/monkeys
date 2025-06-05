import { ComfyuiModelModule } from '@/modules/assets/comfyui-model/comfyui-model.module';
import { ComfyuiModelService } from '@/modules/assets/comfyui-model/comfyui-model.service';
import { DesignModule } from '@/modules/design/design.module';
import { DesignProjectService } from '@/modules/design/design.project.service';
import { ComfyUIModule } from '@/modules/tools/comfyui/comfyui.module';
import { ConductorModule } from '@/modules/workflow/conductor/conductor.module';
import { Module } from '@nestjs/common';
import { TeamsController } from './teams.controller';
import { TeamsService } from './teams.service';

@Module({
  controllers: [TeamsController],
  providers: [TeamsService, ComfyuiModelService, DesignProjectService],
  imports: [ConductorModule, ComfyuiModelModule, ComfyUIModule, DesignModule],
  exports: [TeamsService],
})
export class TeamsModule {}
