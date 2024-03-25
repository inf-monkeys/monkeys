import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { entities } from './database.module';
import { ApikeyRepository } from './repositories/apikey.repository';
import { CredentialsRepository } from './repositories/credential.repository';
import { SystemConfigurationRepository } from './repositories/system-configuration.repository';
import { TeamRepository } from './repositories/team.repository';
import { ToolsRepository } from './repositories/tools.repository';
import { UserRepository } from './repositories/user.repository';
import { WorkflowRepository } from './repositories/workflow.repository';

@Global()
@Module({
  providers: [ToolsRepository, WorkflowRepository, CredentialsRepository, SystemConfigurationRepository, UserRepository, TeamRepository, ApikeyRepository],
  exports: [ToolsRepository, WorkflowRepository, CredentialsRepository, SystemConfigurationRepository, UserRepository, TeamRepository, ApikeyRepository],
  imports: [TypeOrmModule.forFeature(entities)],
})
export class RepositoryMoule {}
