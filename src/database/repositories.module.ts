import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { entities } from './database.module';
import { ApikeyRepository } from './repositories/apikey.repository';
import { CanvasAssetRepositroy } from './repositories/assets-canvas.repository';
import { AssetsCommonRepository } from './repositories/assets-common.repository';
import { KnowledgeBaseAssetRepositroy } from './repositories/assets-knowledge-base.repository';
import { LlmModelAssetRepositroy } from './repositories/assets-llm-model.respository';
import { MediaFileAssetRepositroy } from './repositories/assets-media-file.repository';
import { SdModelAssetRepositroy } from './repositories/assets-sd-model.repository';
import { WorkflowAssetRepositroy } from './repositories/assets-workflow.respository';
import { CredentialsRepository } from './repositories/credential.repository';
import { KnowledgeBaseRepository } from './repositories/knowledge-base.repository';
import { MediaRepository } from './repositories/media.repository';
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
    MediaRepository,
    TriggerTypeRepository,
    KnowledgeBaseRepository,
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
    MediaRepository,
    TriggerTypeRepository,
    KnowledgeBaseRepository,
  ],
  imports: [TypeOrmModule.forFeature(entities)],
})
export class RepositoryMoule {}
