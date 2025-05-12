import { Module } from '@nestjs/common';
import { MediaModule } from '../assets/media/media.module';
import { LLMToolsModule } from '../tools/llm/llm.module';
import { WorkflowModule } from '../workflow/workflow.module';
import { WorkflowOpenAICompatibleController } from './chat.controller';
@Module({
  controllers: [WorkflowOpenAICompatibleController],
  imports: [WorkflowModule, LLMToolsModule, MediaModule],
})
export class ChatModule {}
