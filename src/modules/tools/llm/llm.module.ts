import { Module } from '@nestjs/common';
import { LlmChatController } from './llm.controller';
import { LlmChatService } from './llm.service';

@Module({
  controllers: [LlmChatController],
  providers: [LlmChatService],
  exports: [LlmChatService],
})
export class LLmModule {}
