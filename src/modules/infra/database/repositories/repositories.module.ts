import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { entities } from '../database.module';
import { ComfyuiRepository } from './comfyui.repository';
import { ToolsRepository } from './tools.repository';
import { WorkflowRepository } from './workflow.repository';

@Global()
@Module({
  providers: [ToolsRepository, WorkflowRepository, ComfyuiRepository],
  exports: [ToolsRepository, WorkflowRepository, ComfyuiRepository],
  imports: [TypeOrmModule.forFeature(entities)],
})
export class RepositoryMoule {}
