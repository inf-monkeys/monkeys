import { config } from '@/common/config';
import { ThemeEntity } from '@/database/entities/config/theme';
import { TeamInvitesRequestsEntity } from '@/database/entities/identity/team-invites';
import { SystemConfigurationEntity } from '@/database/entities/system/system-configuration.entity';
import { ToolsCredentialTypeEntity } from '@/database/entities/tools/tools-credential-type.entity';
import { ToolsCredentialEntity } from '@/database/entities/tools/tools-credential.entity';
import { ToolsServerEntity } from '@/database/entities/tools/tools-server.entity';
import { ToolsEntity } from '@/database/entities/tools/tools.entity';
import { WorkflowChatSessionEntity } from '@/database/entities/workflow/workflow-chat-session';
import { WorkflowExecutionEntity } from '@/database/entities/workflow/workflow-execution';
import { WorkflowMetadataEntity } from '@/database/entities/workflow/workflow-metadata';
import { WorkflowPageGroupEntity } from '@/database/entities/workflow/workflow-page-group';
import { WorkflowBuiltinPinnedPageEntity } from '@/database/entities/workflow/workflow-builtin-pinned-page';
import { WorkflowTemplateEntity } from '@/database/entities/workflow/workflow-template';
import { WorkflowTriggersEntity } from '@/database/entities/workflow/workflow-trigger';
import { TimestampSubscriber } from '@/timestamp.subscriber';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EntityClassOrSchema } from '@nestjs/typeorm/dist/interfaces/entity-class-or-schema.type';
import { AgentV2MessageEntity } from './entities/agent-v2/agent-v2-message.entity';
import { AgentV2SessionEntity } from './entities/agent-v2/agent-v2-session.entity';
import { AgentV2MessageQueueEntity, AgentV2TaskStateEntity } from './entities/agent-v2/agent-v2-task-state.entity';
import { AgentV2Entity } from './entities/agent-v2/agent-v2.entity';
import { AgentV3SessionEntity } from './entities/agent-v3/agent-v3-session.entity';
import { AgentV3MessageEntity } from './entities/agent-v3/agent-v3-message.entity';
import { ApiKeyEntity } from './entities/apikey/apikey';
import { AssetsAuthorizationEntity } from './entities/assets/asset-authorization';
import { AssetFilterEntity } from './entities/assets/asset-filter';
import { AssetsMarketPlaceTagEntity } from './entities/assets/asset-marketplace-tag';
import { AssetsMarketplaceTagRelationsEntity } from './entities/assets/asset-marketplace-tag-relations';
import { AssetsTagEntity } from './entities/assets/asset-tag-definitions';
import { AssetsTagRelationsEntity } from './entities/assets/asset-tag-relations';
import { CanvasApplicationEntity } from './entities/assets/canvas/canvas';
import { SqlKnowLedgeBaseEntity } from './entities/assets/knowledge-base/knowledge-base-sql.entity';
import { KnowLedgeBaseEntity } from './entities/assets/knowledge-base/knowledge-base.entity';
import { MediaFileEntity } from './entities/assets/media/media-file';
import { ComfyuiModelServerRelationEntity } from './entities/assets/model/comfyui-model/comfyui-model-server-relation.entity';
import { ComfyuiModelTypeEntity } from './entities/assets/model/comfyui-model/comfyui-model-type.entity';
import { ComfyuiModelEntity } from './entities/assets/model/comfyui-model/comfyui-model.entity';
import { LlmChannelEntity } from './entities/assets/model/llm-channel/llm-channel.entity';
import { LlmModelEntity } from './entities/assets/model/llm-model/llm-model';
import { SdModelEntity } from './entities/assets/model/sd-model/sd-model';
import { ComfyuiServerEntity } from './entities/comfyui/comfyui-server.entity';
import { ComfyuiWorkflowEntity } from './entities/comfyui/comfyui-workflow.entity';
import { ConversationAppEntity } from './entities/conversation-app/conversation-app.entity';
import { ConversationExecutionEntity } from './entities/conversation-app/conversation-executions.entity';
import { DesignAssociationEntity } from './entities/design/design-association';
import { DesignMetadataEntity } from './entities/design/design-metatdata';
import { DesignProjectEntity } from './entities/design/design-project';
import { BattleGroupEntity } from './entities/evaluation/battle-group.entity';
import { EvaluationBattleEntity } from './entities/evaluation/evaluation-battle.entity';
import { EvaluationModuleEntity } from './entities/evaluation/evaluation-module.entity';
import { EvaluationRatingHistoryEntity } from './entities/evaluation/evaluation-rating-history.entity';
import { EvaluationTaskEntity } from './entities/evaluation/evaluation-task.entity';
import { EvaluatorEntity } from './entities/evaluation/evaluator.entity';
import { LeaderboardScoreEntity } from './entities/evaluation/leaderboard-score.entity';
import { LeaderboardEntity } from './entities/evaluation/leaderboard.entity';
import { ModuleEvaluatorEntity } from './entities/evaluation/module-evaluator.entity';
import { VREvaluationTaskEntity } from './entities/evaluation/vr-evaluation-task.entity';
import { TeamEntity } from './entities/identity/team';
import { TeamJoinRequestsEntity } from './entities/identity/team-join-request';
import { UserEntity } from './entities/identity/user';
import { TeamMembersEntity } from './entities/identity/user-team-relationship';
import { InstalledAppEntity } from './entities/marketplace/installed-app.entity';
import { MarketplaceAppVersionEntity } from './entities/marketplace/marketplace-app-version.entity';
import { MarketplaceAppEntity } from './entities/marketplace/marketplace-app.entity';
import { ModelTrainingEntity } from './entities/model-training/model-training';
import { ModelTrainingConfigEntity } from './entities/model-training/model-training-config';
import { ModelTrainingConfigV2Entity } from './entities/model-training/model-training-config-v2';
import { WorkflowObservabilityEntity } from './entities/observability/workflow-observability';
import { OneApiUsersEntity } from './entities/oneapi/oneapi-user.entity';
import { ToolsExecutionEntity } from './entities/tools/tools-execution';
import { ToolsTriggerTypesEntity } from './entities/tools/tools-trigger-types';
import { GlobalWorkflowAssociationsEntity } from './entities/workflow/global-workflow-association';
import { TemporaryWorkflowEntity } from './entities/workflow/temporary-workflow.entity';
import { WorkflowArtifactEntity } from './entities/workflow/workflow-artifact.entity';
import { WorkflowAssociationsEntity } from './entities/workflow/workflow-association';
import { WorkflowPageEntity } from './entities/workflow/workflow-page';

export const entities: EntityClassOrSchema[] = [
  ThemeEntity,
  ToolsEntity,
  ToolsCredentialTypeEntity,
  ToolsCredentialEntity,
  ToolsServerEntity,
  ToolsExecutionEntity,
  ToolsTriggerTypesEntity,
  WorkflowExecutionEntity,
  WorkflowMetadataEntity,
  WorkflowChatSessionEntity,
  WorkflowAssociationsEntity,
  GlobalWorkflowAssociationsEntity,
  WorkflowArtifactEntity,
  WorkflowTriggersEntity,
  WorkflowTemplateEntity,
  SystemConfigurationEntity,
  UserEntity,
  TeamEntity,
  TeamMembersEntity,
  TeamInvitesRequestsEntity,
  ApiKeyEntity,
  WorkflowPageEntity,
  WorkflowPageGroupEntity,
  WorkflowBuiltinPinnedPageEntity,
  LlmModelEntity,
  LlmChannelEntity,
  SdModelEntity,
  KnowLedgeBaseEntity,
  MediaFileEntity,
  AssetFilterEntity,
  AssetsTagEntity,
  CanvasApplicationEntity,
  AssetsAuthorizationEntity,
  AssetsTagRelationsEntity,
  TeamJoinRequestsEntity,
  SqlKnowLedgeBaseEntity,
  AssetsMarketPlaceTagEntity,
  AssetsMarketplaceTagRelationsEntity,
  ComfyuiWorkflowEntity,
  ComfyuiServerEntity,
  ComfyuiModelEntity,
  ComfyuiModelTypeEntity,
  ComfyuiModelServerRelationEntity,
  OneApiUsersEntity,
  ConversationAppEntity,
  ConversationExecutionEntity,
  WorkflowObservabilityEntity,
  DesignMetadataEntity,
  DesignProjectEntity,
  DesignAssociationEntity,
  MarketplaceAppEntity,
  MarketplaceAppVersionEntity,
  InstalledAppEntity,
  EvaluationModuleEntity,
  EvaluatorEntity,
  ModuleEvaluatorEntity,
  LeaderboardEntity,
  LeaderboardScoreEntity,
  EvaluationBattleEntity,
  BattleGroupEntity,
  EvaluationRatingHistoryEntity,
  EvaluationTaskEntity,
  VREvaluationTaskEntity,
  TemporaryWorkflowEntity,
  AgentV2Entity,
  AgentV2SessionEntity,
  AgentV2MessageEntity,
  AgentV2TaskStateEntity,
  AgentV2MessageQueueEntity,
  AgentV3SessionEntity,
  AgentV3MessageEntity,
  ModelTrainingEntity,
  ModelTrainingConfigEntity,
  ModelTrainingConfigV2Entity,
];

export const DatabaseModule = TypeOrmModule.forRoot({
  ...config.database,
  entityPrefix: config.server.appId.concat('_'),
  entities: entities,
  subscribers: [TimestampSubscriber],
});
