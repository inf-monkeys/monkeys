import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { entities } from './database.module';
import { ApikeyRepository } from './repositories/apikey.repository';
import { CanvasAssetRepositroy } from './repositories/assets-canvas.repository';
import { AssetsCommonRepository } from './repositories/assets-common.repository';
import { LlmModelAssetRepositroy } from './repositories/assets-llm-model.respository';
import { MediaFileAssetRepositroy } from './repositories/assets-media-file.repository';
import { SdModelAssetRepositroy } from './repositories/assets-sd-model.repository';
import { TableCollectionAssetRepositroy } from './repositories/assets-table-collection.repository';
import { TextCollectionAssetRepositroy } from './repositories/assets-text-collections.repository';
import { WorkflowAssetRepositroy } from './repositories/assets-workflow.respository';
import { CredentialsRepository } from './repositories/credential.repository';
import { SystemConfigurationRepository } from './repositories/system-configuration.repository';
import { TeamRepository } from './repositories/team.repository';
import { ToolsRepository } from './repositories/tools.repository';
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
    TextCollectionAssetRepositroy,
    TableCollectionAssetRepositroy,
    MediaFileAssetRepositroy,
    WorkflowAssetRepositroy,
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
    TextCollectionAssetRepositroy,
    TableCollectionAssetRepositroy,
    MediaFileAssetRepositroy,
    WorkflowAssetRepositroy,
  ],
  imports: [TypeOrmModule.forFeature(entities)],
})
export class RepositoryMoule {}
