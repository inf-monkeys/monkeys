import { Module } from '@nestjs/common';
import { ComfyuiExecutionController } from './comfyui.execution.controller';
import { ComfyuiServerController } from './comfyui.server.controller';
import { ComfyUIService } from './comfyui.service';
import { ComfyuiWorkflowController } from './comfyui.workflow.controller';

@Module({
  providers: [ComfyUIService],
  controllers: [ComfyuiWorkflowController, ComfyuiServerController, ComfyuiExecutionController],
})
export class ComfyUIModule {}
