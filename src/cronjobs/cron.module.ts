import { ComfyuiModelModule } from '@/modules/assets/comfyui-model/comfyui-model.module';
import { TemporaryWorkflowModule } from '@/modules/temporary-workflow/temporary-workflow.module';
import { TenantModule } from '@/modules/tenant/tenant.module';
import { ComfyUIModule } from '@/modules/tools/comfyui/comfyui.module';
import { ToolsModule } from '@/modules/tools/tools.module';
import { WorkflowModule } from '@/modules/workflow/workflow.module';
import { Module } from '@nestjs/common';
import { ComfyfileCronService } from './services/comfyfile.cron.service';
import { ComfyuiModelCronService } from './services/comfyui-model.cron.service';
import { FillWorkflowExecutionStatusCronService } from './services/fill-workflow-execution-status.cron.service';
import { TenantTemporaryWorkflowCleanupCronService } from './services/tenant-temporary-workflow-cleanup.cron.service';
import { ToolsHealthCheckCronService } from './services/tools-health-check.cron.service';
import { ToolsRegistryCronService } from './services/tools-registry.cron.service';
import { WorkflowCronService } from './services/workflow.cron.service';

@Module({
  providers: [
    ToolsRegistryCronService,
    WorkflowCronService,
    ToolsHealthCheckCronService,
    ComfyfileCronService,
    ComfyuiModelCronService,
    FillWorkflowExecutionStatusCronService,
    TenantTemporaryWorkflowCleanupCronService,
  ],
  imports: [ToolsModule, WorkflowModule, ComfyuiModelModule, ComfyUIModule, TenantModule, TemporaryWorkflowModule],
})
export class CronJobModule {}
