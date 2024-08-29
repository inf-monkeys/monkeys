import { ComfyUIService } from '@/modules/tools/comfyui/comfyui.service';
import { Module } from '@nestjs/common';
import { ComfyuiModelController } from './comfyui-model.controller';
import { ComfyuiModelService } from './comfyui-model.service';
import { ComfyuiModelTypeController } from './comfyui-model.type.controller';

@Module({
  providers: [ComfyuiModelService, ComfyUIService],
  controllers: [ComfyuiModelTypeController, ComfyuiModelController],
  exports: [ComfyuiModelService],
})
export class ComfyuiModelModule {}
