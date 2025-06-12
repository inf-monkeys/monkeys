import { CommonModule } from '@/common/common.module';
import { ConversationAppEntity } from '@/database/entities/conversation-app/conversation-app.entity';
import { DesignMetadataEntity } from '@/database/entities/design/design-metatdata';
import { DesignProjectEntity } from '@/database/entities/design/design-project';
import { WorkflowPageEntity } from '@/database/entities/workflow/workflow-page';
import { WorkflowPageGroupEntity } from '@/database/entities/workflow/workflow-page-group';
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetsModule } from '../assets/assets.module';
import { ToolsModule } from '../tools/tools.module';
import { ConductorModule } from './conductor/conductor.module';
import { WorkflowAssetsController } from './workflow.assets.controller';
import { WorkflowAssetsService } from './workflow.assets.service';
import { WorkflowAssociationController } from './workflow.association.controller';
import { WorkflowAssociationService } from './workflow.association.service';
import { WorkflowChatSessionController } from './workflow.chat-sessions.controller';
import { WorkflowChatSessionService } from './workflow.chat-sessions.service';
import { WorkflowCommonService } from './workflow.common.service';
import { WorkflowCrudController } from './workflow.crud.controller';
import { WorkflowCrudService } from './workflow.curd.service';
import { WorkflowCustomTriggerInvokeController } from './workflow.custom-trigger-invoke.controller';
import { WorkflowCustomTriggerInvokeService } from './workflow.custom-trigger-invoke.service';
import { WorkflowExecutionPersistenceService } from './workflow.execution-persistence.service';
import { WorkflowExecutionController } from './workflow.execution.controller';
import { WorkflowExecutionService } from './workflow.execution.service';
import { WorkflowLogsController } from './workflow.log.controller';
import { WorkflowLogService } from './workflow.log.service';
import { WorkflowObservabilityController } from './workflow.observability.controller';
import { WorkflowObservabilityService } from './workflow.observability.service';
import { WorkflowPageController } from './workflow.page.controller';
import { WorkflowPageService } from './workflow.page.service';
import { WorkflowStatisticsController } from './workflow.statistics.controller';
import { WorkflowStatisticsService } from './workflow.statstics.service';
import { WorkflowTrackerService } from './workflow.tracker.service';
import { WorkflowTriggerController } from './workflow.trigger.controller';
import { WorkflowTriggerService } from './workflow.trigger.service';
import { WorkflowValidateController } from './workflow.validate.controller';
import { WorkflowValidateService } from './workflow.validate.service';
import { WorkflowWebhookController } from './workflow.webhook.controller';
import { WorkflowWebhookService } from './workflow.webhook.service';

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
    WorkflowObservabilityController,
    WorkflowAssociationController,
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
    WorkflowTrackerService,
    WorkflowObservabilityService,
    WorkflowExecutionPersistenceService,
    WorkflowAssociationService,
  ],
  imports: [
    ConductorModule,
    forwardRef(() => AssetsModule),
    TypeOrmModule.forFeature([WorkflowPageEntity, WorkflowPageGroupEntity, ConversationAppEntity, DesignMetadataEntity, DesignProjectEntity]),
    ToolsModule,
    CommonModule,
  ],
  exports: [WorkflowCrudService, WorkflowExecutionService, WorkflowTrackerService, WorkflowExecutionPersistenceService, WorkflowPageService, TypeOrmModule],
})
export class WorkflowModule { }
