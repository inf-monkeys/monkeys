import { Module } from '@nestjs/common';
import { ComfyuiController } from './comfyui.controller';
import { ComfyuiService } from './comfyui.service';

@Module({
  controllers: [ComfyuiController],
  providers: [ComfyuiService],
  exports: [ComfyuiService],
})
export class ComfyuiModule {}
