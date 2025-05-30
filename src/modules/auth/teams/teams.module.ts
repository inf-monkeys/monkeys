import { ComfyuiModelModule } from '@/modules/assets/comfyui-model/comfyui-model.module';
import { ComfyuiModelService } from '@/modules/assets/comfyui-model/comfyui-model.service';
import { ComfyUIModule } from '@/modules/tools/comfyui/comfyui.module';
import { ConductorModule } from '@/modules/workflow/conductor/conductor.module';
import { Module } from '@nestjs/common';
import { TeamsController } from './teams.controller';
import { TeamsService } from './teams.service';

@Module({
  controllers: [TeamsController],
  providers: [TeamsService, ComfyuiModelService],
  imports: [ConductorModule, ComfyuiModelModule, ComfyUIModule],
  exports: [TeamsService],
})
export class TeamsModule {}
