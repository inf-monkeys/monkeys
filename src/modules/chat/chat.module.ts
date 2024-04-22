import { Module } from '@nestjs/common';
import { ToolsModule } from '../tools/tools.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

@Module({
  controllers: [ChatController],
  providers: [ChatService],
  imports: [ToolsModule],
})
export class ChatModule {}
