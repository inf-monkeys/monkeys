import { config } from '@/common/config';
import { ComfyuiServerEntity } from '@/entities/comfyui/comfyui-server.entity';
import { ThemeEntity } from '@/entities/config/theme';
import { SystemConfigurationEntity } from '@/entities/system/system-configuration.entity';
import { ToolsCredentialTypeEntity } from '@/entities/tools/tools-credential-type.entity';
import { ToolsCredentialEntity } from '@/entities/tools/tools-credential.entity';
import { ToolsServerEntity } from '@/entities/tools/tools-server.entity';
import { ToolsEntity } from '@/entities/tools/tools.entity';
import { WorkflowChatSessionEntity } from '@/entities/workflow/workflow-chat-session';
import { WorkflowExecutionEntity } from '@/entities/workflow/workflow-execution';
import { WorkflowMetadataEntity } from '@/entities/workflow/workflow-metadata';
import { WorkflowTemplateEntity } from '@/entities/workflow/workflow-template';
import { WorkflowTriggersEntity } from '@/entities/workflow/workflow-trigger';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EntityClassOrSchema } from '@nestjs/typeorm/dist/interfaces/entity-class-or-schema.type';

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
  ComfyuiServerEntity,
  SystemConfigurationEntity,
];

export const DatabaseModule = TypeOrmModule.forRoot({
  ...config.database,
  entityPrefix: config.server.appId.concat('_'),
  entities: entities,
});