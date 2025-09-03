import { CommonModule } from '@/common/common.module';
import { AgentV2Entity } from '@/database/entities/agent-v2/agent-v2.entity';
import { ConversationAppEntity } from '@/database/entities/conversation-app/conversation-app.entity';
import { DesignMetadataEntity } from '@/database/entities/design/design-metatdata';
import { DesignProjectEntity } from '@/database/entities/design/design-project';
import { WorkflowArtifactEntity } from '@/database/entities/workflow/workflow-artifact.entity';
import { WorkflowExecutionEntity } from '@/database/entities/workflow/workflow-execution';
import { WorkflowPageEntity } from '@/database/entities/workflow/workflow-page';
import { WorkflowPageGroupEntity } from '@/database/entities/workflow/workflow-page-group';
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetsModule } from '../assets/assets.module';
import { MarketplaceModule } from '../marketplace/marketplace.module';
import { ToolsModule } from '../tools/tools.module';
import { ConductorModule } from './conductor/conductor.module';
import { WorkflowArtifactController } from './workflow.artifact.controller';
import { WorkflowArtifactService } from './workflow.artifact.service';
import { WorkflowAssetsController } from './workflow.assets.controller';
import { WorkflowAssetsService } from './workflow.assets.service';
import { WorkflowAssociationController } from './workflow.association.controller';
import { WorkflowAssociationCrudService } from './workflow.association.crud.service';
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
    WorkflowArtifactController,
  ],
  providers: [
    WorkflowCrudService,
    WorkflowAssociationCrudService,
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
    WorkflowArtifactService,
  ],
  imports: [
    ConductorModule,
    forwardRef(() => AssetsModule),
    TypeOrmModule.forFeature([
      WorkflowPageEntity,
      WorkflowPageGroupEntity,
      ConversationAppEntity,
      AgentV2Entity,
      DesignMetadataEntity,
      DesignProjectEntity,
      WorkflowExecutionEntity,
      WorkflowArtifactEntity,
    ]),
    ToolsModule,
    CommonModule,
    MarketplaceModule,
  ],
  exports: [WorkflowCrudService, WorkflowAssociationCrudService, WorkflowExecutionService, WorkflowTrackerService, WorkflowExecutionPersistenceService, WorkflowPageService, TypeOrmModule],
})
export class WorkflowModule {}
