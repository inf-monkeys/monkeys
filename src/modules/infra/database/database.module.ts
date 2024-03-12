import { config } from '@/common/config';
import { ComfyuiServerEntity } from '@/entities/comfyui/comfyui-server.entity';
import { ThemeEntity } from '@/entities/config/theme';
import { ToolsCredentialEntity } from '@/entities/tools/tools-credential.entity';
import { ToolsServerEntity } from '@/entities/tools/tools-server.entity';
import { ToolsEntity } from '@/entities/tools/tools.entity';
import { WorkflowMetadataEntity } from '@/entities/workflow/workflow';
import { WorkflowChatSessionEntity } from '@/entities/workflow/workflow-chat-session';
import { WorkflowExecutionEntity } from '@/entities/workflow/workflow-execution';
import { WorkflowTemplateEntity } from '@/entities/workflow/workflow-template';
import { WorkflowTriggersEntity } from '@/entities/workflow/workflow-trigger';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EntityClassOrSchema } from '@nestjs/typeorm/dist/interfaces/entity-class-or-schema.type';

export const entities: EntityClassOrSchema[] = [
  ThemeEntity,
  ToolsEntity,
  ToolsCredentialEntity,
  ToolsServerEntity,
  WorkflowExecutionEntity,
  WorkflowMetadataEntity,
  WorkflowChatSessionEntity,
  WorkflowTriggersEntity,
  WorkflowTemplateEntity,
  ComfyuiServerEntity,
];

export const DatabaseModule = TypeOrmModule.forRoot({
  ...config.database,
  entityPrefix: config.server.appId.concat('_'),
  entities: entities,
});
