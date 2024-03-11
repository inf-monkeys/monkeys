import { Module } from '@nestjs/common';
import { ConductorModule } from './conductor/conductor.module';
import { WorkflowAssetsController } from './workflow.assets.controller';
import { WorkflowAssetsService } from './workflow.assets.service';
import { WorkflowCommonService } from './workflow.common.service';
import { WorkflowCrudController } from './workflow.crud.controller';
import { WorkflowCrudService } from './workflow.curd.service';
import { WorkflowExecutionController } from './workflow.execution.controller';
import { WorkflowExecutionService } from './workflow.execution.service';
import { WorkflowTriggerController } from './workflow.trigger.controller';
import { WorkflowTriggerService } from './workflow.trigger.service';
import { WorkflowValidateController } from './workflow.validate.controller';
import { WorkflowValidateService } from './workflow.validate.service';
import { WorkflowWebhookController } from './workflow.webhook.controller';
import { WorkflowWebhookService } from './workflow.webhook.service';

@Module({
  controllers: [WorkflowCrudController, WorkflowValidateController, WorkflowExecutionController, WorkflowWebhookController, WorkflowTriggerController, WorkflowAssetsController],
  providers: [WorkflowCrudService, WorkflowValidateService, WorkflowExecutionService, WorkflowWebhookService, WorkflowCommonService, WorkflowTriggerService, WorkflowAssetsService],
  imports: [ConductorModule],
  exports: [WorkflowCrudService],
})
export class WorkflowModule {}
