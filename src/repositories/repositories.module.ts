import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { entities } from '../entities/database.module';
import { ComfyuiRepository } from './comfyui.repository';
import { CredentialsRepository } from './credential.repository';
import { SystemConfigurationRepository } from './system-configuration.repository';
import { TeamRepository } from './team.repository';
import { ToolsRepository } from './tools.repository';
import { UserRepository } from './user.repository';
import { WorkflowRepository } from './workflow.repository';

@Global()
@Module({
  providers: [ToolsRepository, WorkflowRepository, ComfyuiRepository, CredentialsRepository, SystemConfigurationRepository, UserRepository, TeamRepository],
  exports: [ToolsRepository, WorkflowRepository, ComfyuiRepository, CredentialsRepository, SystemConfigurationRepository, UserRepository, TeamRepository],
  imports: [TypeOrmModule.forFeature(entities)],
})
export class RepositoryMoule {}
