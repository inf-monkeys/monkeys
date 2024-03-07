import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { entities } from '../database.module';
import { ToolsRepository } from './tools.repository';
import { WorkflowRepository } from './workflow.repository';

@Global()
@Module({
  providers: [ToolsRepository, WorkflowRepository],
  exports: [ToolsRepository, WorkflowRepository],
  imports: [TypeOrmModule.forFeature(entities)],
})
export class RepositoryMoule {}
