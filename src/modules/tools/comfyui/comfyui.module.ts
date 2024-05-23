import { Module } from '@nestjs/common';
import { ComfyUIController } from './comfyui.controller';
import { ComfyUIService } from './comfyui.service';

@Module({
  providers: [ComfyUIService],
  controllers: [ComfyUIController],
})
export class ComfyUIModule {}
