import { Module } from '@nestjs/common';
import { ToolsModule } from './modules/tools/tools.module';
import { WorkflowModule } from './modules/workflow/workflow.module';

@Module({
  imports: [WorkflowModule, ToolsModule],
})
export class OpenapiModule {}
