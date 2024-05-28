import { ToolsModule } from '@/modules/tools/tools.module';
import { WorkflowModule } from '@/modules/workflow/workflow.module';
import { Module } from '@nestjs/common';
import { ComfyfileCronService } from './services/comfyfile.cron.service';
import { ToolsHealthCheckCronService } from './services/tools-health-check.cron.service';
import { ToolsRegistryCronService } from './services/tools-registry.cron.service';
import { WorkflowCronService } from './services/workflow.cron.service';

@Module({
  providers: [ToolsRegistryCronService, WorkflowCronService, ToolsHealthCheckCronService, ComfyfileCronService],
  imports: [ToolsModule, WorkflowModule],
})
export class CronJobModule {}
