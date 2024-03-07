import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { entities } from '../database.module';
import { ToolsRepository } from './tools.repository';

@Global()
@Module({
  providers: [ToolsRepository],
  exports: [ToolsRepository],
  imports: [TypeOrmModule.forFeature(entities)],
})
export class RepositoryMoule {}
