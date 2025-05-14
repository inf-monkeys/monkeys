import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { entities } from './database.module';
import { ApikeyRepository } from './repositories/apikey.repository';
import { CanvasAssetRepositroy } from './repositories/assets-canvas.repository';
import { ComfyuiModelTypeAssetRepositroy } from './repositories/assets-comfyui-model-type.repositor';
import { ComfyuiModelAssetRepositroy } from './repositories/assets-comfyui-model.repository';
import { ComfyuiWorkflowAssetRepositroy } from './repositories/assets-comfyui-workflow.respository';
import { AssetsCommonRepository } from './repositories/assets-common.repository';
import { ConversationAppAssetRepositroy } from './repositories/assets-conversation-app.repository';
import { SqlKnowledgeBaseAssetRepositroy } from './repositories/assets-knowledge-base-sql.repository';
import { KnowledgeBaseAssetRepositroy } from './repositories/assets-knowledge-base.repository';
import { LlmChannelAssetRepositroy } from './repositories/assets-llm-channel.respository';
import { LlmModelAssetRepositroy } from './repositories/assets-llm-model.respository';
import { AssetsMarketPlaceRepository } from './repositories/assets-marketplace.repository';
import { MediaFileAssetRepositroy } from './repositories/assets-media-file.repository';
import { SdModelAssetRepositroy } from './repositories/assets-sd-model.repository';
import { WorkflowAssetRepositroy } from './repositories/assets-workflow.respository';
import { ComfyuiModelRepository } from './repositories/comfyui-model.repository';
import { ComfyuiRepository } from './repositories/comfyui.repository';
import { ConversationAppRepository } from './repositories/conversation-app.repository';
import { CredentialsRepository } from './repositories/credential.repository';
import { DesignRepository } from './repositories/design.repository';
import { SqlKnowledgeBaseRepository } from './repositories/knowledge-base-sql.repository';
import { KnowledgeBaseRepository } from './repositories/knowledge-base.repository';
import { LlmModelRepository } from './repositories/llm-model.repository';
import { MediaFileRepository } from './repositories/media.repository';
import { ObservabilityRepository } from './repositories/observability.repository';
import { OneApiRepository } from './repositories/oneapi.respository';
import { SdModelRepository } from './repositories/sd-model.repository';
import { SystemConfigurationRepository } from './repositories/system-configuration.repository';
import { TeamRepository } from './repositories/team.repository';
import { ToolsRepository } from './repositories/tools.repository';
import { TriggerTypeRepository } from './repositories/trigger-type.repository';
import { UserRepository } from './repositories/user.repository';
import { WorkflowRepository } from './repositories/workflow.repository';

@Global()
@Module({
  providers: [
    ToolsRepository,
    WorkflowRepository,
    CredentialsRepository,
    SystemConfigurationRepository,
    UserRepository,
    TeamRepository,
    ApikeyRepository,
    AssetsCommonRepository,
    CanvasAssetRepositroy,
    LlmModelAssetRepositroy,
    LlmChannelAssetRepositroy,
    SdModelAssetRepositroy,
    KnowledgeBaseAssetRepositroy,
    MediaFileAssetRepositroy,
    WorkflowAssetRepositroy,
    MediaFileRepository,
    TriggerTypeRepository,
    KnowledgeBaseRepository,
    SqlKnowledgeBaseAssetRepositroy,
    SqlKnowledgeBaseRepository,
    LlmModelRepository,
    SdModelRepository,
    AssetsMarketPlaceRepository,
    ComfyuiRepository,
    ComfyuiWorkflowAssetRepositroy,
    ComfyuiModelRepository,
    ComfyuiModelAssetRepositroy,
    ComfyuiModelTypeAssetRepositroy,
    OneApiRepository,
    ConversationAppRepository,
    ConversationAppAssetRepositroy,
    ObservabilityRepository,
    DesignRepository,
  ],
  exports: [
    ToolsRepository,
    WorkflowRepository,
    CredentialsRepository,
    SystemConfigurationRepository,
    UserRepository,
    TeamRepository,
    ApikeyRepository,
    AssetsCommonRepository,
    CanvasAssetRepositroy,
    LlmModelAssetRepositroy,
    LlmChannelAssetRepositroy,
    SdModelAssetRepositroy,
    KnowledgeBaseAssetRepositroy,
    MediaFileAssetRepositroy,
    WorkflowAssetRepositroy,
    MediaFileRepository,
    TriggerTypeRepository,
    KnowledgeBaseRepository,
    SqlKnowledgeBaseAssetRepositroy,
    SqlKnowledgeBaseRepository,
    LlmModelRepository,
    SdModelRepository,
    AssetsMarketPlaceRepository,
    ComfyuiRepository,
    ComfyuiWorkflowAssetRepositroy,
    ComfyuiModelRepository,
    ComfyuiModelAssetRepositroy,
    ComfyuiModelTypeAssetRepositroy,
    OneApiRepository,
    ConversationAppRepository,
    ConversationAppAssetRepositroy,
    ObservabilityRepository,
    DesignRepository,
  ],
  imports: [TypeOrmModule.forFeature(entities)],
})
export class RepositoryMoule {}
