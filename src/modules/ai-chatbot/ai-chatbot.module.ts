import { Module } from '@nestjs/common';
import { AiChatbotController } from './ai-chatbot.controller';
import { AiChatbotService } from './ai-chatbot.service';

@Module({
  controllers: [AiChatbotController],
  providers: [AiChatbotService],
  imports: [],
})
export class AiChatbotModule {}
