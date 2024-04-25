import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { entities } from './database.module';
import { ApikeyRepository } from './repositories/apikey.repository';
import { CanvasAssetRepositroy } from './repositories/assets-canvas.repository';
import { AssetsCommonRepository } from './repositories/assets-common.repository';
import { SqlKnowledgeBaseAssetRepositroy } from './repositories/assets-knowledge-base-sql.repository';
import { KnowledgeBaseAssetRepositroy } from './repositories/assets-knowledge-base.repository';
import { LlmModelAssetRepositroy } from './repositories/assets-llm-model.respository';
import { AssetsMarketPlaceRepository } from './repositories/assets-marketplace.repository';
import { MediaFileAssetRepositroy } from './repositories/assets-media-file.repository';
import { SdModelAssetRepositroy } from './repositories/assets-sd-model.repository';
import { WorkflowAssetRepositroy } from './repositories/assets-workflow.respository';
import { CredentialsRepository } from './repositories/credential.repository';
import { SqlKnowledgeBaseRepository } from './repositories/knowledge-base-sql.repository';
import { KnowledgeBaseRepository } from './repositories/knowledge-base.repository';
import { LlmModelRepository } from './repositories/llm-model.repository';
import { MediaFileRepository } from './repositories/media.repository';
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
  ],
  imports: [TypeOrmModule.forFeature(entities)],
})
export class RepositoryMoule {}
