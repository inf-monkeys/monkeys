import { Module } from '@nestjs/common';
import { KnowledgeBaseModule } from '../../assets/knowledge-base/knowledge-base.module';
import { ToolsModule } from '../tools.module';
import { LlmController } from './llm.controller';
import { LlmService } from './llm.service';

@Module({
  controllers: [LlmController],
  providers: [LlmService],
  imports: [ToolsModule, KnowledgeBaseModule],
})
export class LLMToolsModule {}