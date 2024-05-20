import { config } from '@/common/config';
import { ThemeEntity } from '@/database/entities/config/theme';
import { SystemConfigurationEntity } from '@/database/entities/system/system-configuration.entity';
import { ToolsCredentialTypeEntity } from '@/database/entities/tools/tools-credential-type.entity';
import { ToolsCredentialEntity } from '@/database/entities/tools/tools-credential.entity';
import { ToolsServerEntity } from '@/database/entities/tools/tools-server.entity';
import { ToolsEntity } from '@/database/entities/tools/tools.entity';
import { WorkflowChatSessionEntity } from '@/database/entities/workflow/workflow-chat-session';
import { WorkflowExecutionEntity } from '@/database/entities/workflow/workflow-execution';
import { WorkflowMetadataEntity } from '@/database/entities/workflow/workflow-metadata';
import { WorkflowTemplateEntity } from '@/database/entities/workflow/workflow-template';
import { WorkflowTriggersEntity } from '@/database/entities/workflow/workflow-trigger';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EntityClassOrSchema } from '@nestjs/typeorm/dist/interfaces/entity-class-or-schema.type';
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
import { LlmModelEntity } from './entities/assets/model/llm-model/llm-model';
import { SdModelEntity } from './entities/assets/model/sd-model/sd-model';
import { ComfyuiWorkflowEntity } from './entities/comfyui/comfyui-workflow.entity';
import { TeamEntity } from './entities/identity/team';
import { TeamJoinRequestsEntity } from './entities/identity/team-join-request';
import { UserEntity } from './entities/identity/user';
import { TeamMembersEntity } from './entities/identity/user-team-relationship';
import { ToolsTriggerTypesEntity } from './entities/tools/tools-trigger-types';
import { WorkflowPageEntity } from './entities/workflow/workflow-page';

export const entities: EntityClassOrSchema[] = [
  ThemeEntity,
  ToolsEntity,
  ToolsCredentialTypeEntity,
  ToolsCredentialEntity,
  ToolsServerEntity,
  ToolsTriggerTypesEntity,
  WorkflowExecutionEntity,
  WorkflowMetadataEntity,
  WorkflowChatSessionEntity,
  WorkflowTriggersEntity,
  WorkflowTemplateEntity,
  SystemConfigurationEntity,
  UserEntity,
  TeamEntity,
  TeamMembersEntity,
  ApiKeyEntity,
  WorkflowPageEntity,
  LlmModelEntity,
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
];

export const DatabaseModule = TypeOrmModule.forRoot({
  ...config.database,
  entityPrefix: config.server.appId.concat('_'),
  entities: entities,
});
