import { Module } from '@nestjs/common';
import { KnowledgeBaseModule } from '../assets/knowledge-base/knowledge-base.module';
import { ToolsModule } from '../tools/tools.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

@Module({
  controllers: [ChatController],
  providers: [ChatService],
  imports: [ToolsModule, KnowledgeBaseModule],
})
export class ChatModule {}
