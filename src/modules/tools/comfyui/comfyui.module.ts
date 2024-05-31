import { Module } from '@nestjs/common';
import { ComfyuiDependencyController } from './comfyui.dependency.controller';
import { ComfyuiExecutionController } from './comfyui.execution.controller';
import { ComfyuiServerController } from './comfyui.server.controller';
import { ComfyUIService } from './comfyui.service';
import { ComfyuiWorkflowController } from './comfyui.workflow.controller';

@Module({
  providers: [ComfyUIService],
  controllers: [ComfyuiWorkflowController, ComfyuiServerController, ComfyuiExecutionController, ComfyuiDependencyController],
})
export class ComfyUIModule {}
