import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { entities } from '../database.module';
import { ComfyuiRepository } from './comfyui.repository';
import { CredentialsRepository } from './credential.repository';
import { SystemConfigurationRepository } from './system-configuration.repository';
import { ToolsRepository } from './tools.repository';
import { WorkflowRepository } from './workflow.repository';

@Global()
@Module({
  providers: [ToolsRepository, WorkflowRepository, ComfyuiRepository, CredentialsRepository, SystemConfigurationRepository],
  exports: [ToolsRepository, WorkflowRepository, ComfyuiRepository, CredentialsRepository, SystemConfigurationRepository],
  imports: [TypeOrmModule.forFeature(entities)],
})
export class RepositoryMoule {}
