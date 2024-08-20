// import { ComfyuiModelModule } from '@/modules/assets/comfyui-model/comfyui-model.module';
import { Module } from '@nestjs/common';
import { ComfyuiDependencyController } from './comfyui.dependency.controller';
import { ComfyuiExecutionController } from './comfyui.execution.controller';
import { ComfyuiServerController } from './comfyui.server.controller';
import { ComfyUIService } from './comfyui.service';
import { ComfyuiWorkflowController } from './comfyui.workflow.controller';

@Module({
  // imports: [ComfyuiModelModule],
  providers: [ComfyUIService],
  controllers: [ComfyuiWorkflowController, ComfyuiServerController, ComfyuiExecutionController, ComfyuiDependencyController],
  exports: [ComfyUIService],
})
export class ComfyUIModule {}
