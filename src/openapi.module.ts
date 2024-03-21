import { Module } from '@nestjs/common';
import { ApikeyModule } from './modules/auth/apikey/apikey.module';
import { ToolsModule } from './modules/tools/tools.module';
import { WorkflowModule } from './modules/workflow/workflow.module';

@Module({
  imports: [ApikeyModule, WorkflowModule, ToolsModule],
})
export class OpenapiModule {}
