import { Module } from '@nestjs/common';
import { ComfyuiModelController } from './comfyui-model.controller';
import { ComfyuiModelService } from './comfyui-model.service';
import { ComfyuiModelTypeController } from './comfyui-model.type.controller';

@Module({
  providers: [ComfyuiModelService],
  controllers: [ComfyuiModelController, ComfyuiModelTypeController],
})
export class ComfyuiModelModule {}
