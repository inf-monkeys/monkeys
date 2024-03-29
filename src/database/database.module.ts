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
import { AssetAuthorizationEntity } from './entities/assets/asset-authorization';
import { AssetFilterEntity } from './entities/assets/asset-filter';
import { AssetsTagEntity } from './entities/assets/asset-tags';
import { CanvasApplicationEntity } from './entities/assets/canvas/canvas';
import { TableCollectionEntity } from './entities/assets/collection/table-collection/table-collection';
import { TextCollectionEntity } from './entities/assets/collection/text-collection/text-collection';
import { MediaFileEntity } from './entities/assets/media/media-file';
import { LlmModelEntity } from './entities/assets/model/llm-model/llm-model';
import { SdModelEntity } from './entities/assets/model/sd-model/sd-model';
import { TeamEntity } from './entities/identity/team';
import { UserEntity } from './entities/identity/user';
import { UserTeamRelationshipEntity } from './entities/identity/user-team-relationship';
import { WorkflowPageEntity } from './entities/workflow/workflow-page';

export const entities: EntityClassOrSchema[] = [
  ThemeEntity,
  ToolsEntity,
  ToolsCredentialTypeEntity,
  ToolsCredentialEntity,
  ToolsServerEntity,
  WorkflowExecutionEntity,
  WorkflowMetadataEntity,
  WorkflowChatSessionEntity,
  WorkflowTriggersEntity,
  WorkflowTemplateEntity,
  SystemConfigurationEntity,
  UserEntity,
  TeamEntity,
  UserTeamRelationshipEntity,
  ApiKeyEntity,
  WorkflowPageEntity,
  LlmModelEntity,
  SdModelEntity,
  TableCollectionEntity,
  TextCollectionEntity,
  MediaFileEntity,
  AssetFilterEntity,
  AssetsTagEntity,
  CanvasApplicationEntity,
  AssetAuthorizationEntity,
];

export const DatabaseModule = TypeOrmModule.forRoot({
  ...config.database,
  entityPrefix: config.server.appId.concat('_'),
  entities: entities,
});
