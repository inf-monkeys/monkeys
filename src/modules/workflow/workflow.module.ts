import { WorkflowPageEntity } from '@/database/entities/workflow/workflow-page';
import { WorkflowPageGroupEntity } from '@/database/entities/workflow/workflow-page-group';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ToolsModule } from '../tools/tools.module';
import { ConductorModule } from './conductor/conductor.module';
import { WorkflowAssetsController } from './workflow.assets.controller';
import { WorkflowAssetsService } from './workflow.assets.service';
import { WorkflowChatSessionController } from './workflow.chat-sessions.controller';
import { WorkflowChatSessionService } from './workflow.chat-sessions.service';
import { WorkflowCommonService } from './workflow.common.service';
import { WorkflowCrudController } from './workflow.crud.controller';
import { WorkflowCrudService } from './workflow.curd.service';
import { WorkflowCustomTriggerInvokeController } from './workflow.custom-trigger-invoke.controller';
import { WorkflowCustomTriggerInvokeService } from './workflow.custom-trigger-invoke.service';
import { WorkflowExecutionController } from './workflow.execution.controller';
import { WorkflowExecutionService } from './workflow.execution.service';
import { WorkflowLogsController } from './workflow.log.controller';
import { WorkflowLogService } from './workflow.log.service';
import { WorkflowPageController } from './workflow.page.controller';
import { WorkflowPageService } from './workflow.page.service';
import { WorkflowStatisticsController } from './workflow.statistics.controller';
import { WorkflowStatisticsService } from './workflow.statstics.service';
import { WorkflowTriggerController } from './workflow.trigger.controller';
import { WorkflowTriggerService } from './workflow.trigger.service';
import { WorkflowValidateController } from './workflow.validate.controller';
import { WorkflowValidateService } from './workflow.validate.service';
import { WorkflowWebhookController } from './workflow.webhook.controller';
import { WorkflowWebhookService } from './workflow.webhook.service';
import { ConversationAppEntity } from '@/database/entities/conversation-app/conversation-app.entity';

@Module({
  controllers: [
    WorkflowCrudController,
    WorkflowValidateController,
    WorkflowExecutionController,
    WorkflowWebhookController,
    WorkflowTriggerController,
    WorkflowAssetsController,
    WorkflowChatSessionController,
    WorkflowPageController,
    WorkflowCustomTriggerInvokeController,
    WorkflowLogsController,
    WorkflowStatisticsController,
  ],
  providers: [
    WorkflowCrudService,
    WorkflowValidateService,
    WorkflowExecutionService,
    WorkflowWebhookService,
    WorkflowCommonService,
    WorkflowTriggerService,
    WorkflowAssetsService,
    WorkflowChatSessionService,
    WorkflowPageService,
    WorkflowCustomTriggerInvokeService,
    WorkflowLogService,
    WorkflowStatisticsService,
  ],
  imports: [ConductorModule, TypeOrmModule.forFeature([WorkflowPageEntity, WorkflowPageGroupEntity, ConversationAppEntity]), ToolsModule],
  exports: [WorkflowCrudService, WorkflowExecutionService],
})
export class WorkflowModule {}
