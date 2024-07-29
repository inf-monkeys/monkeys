import { Module } from '@nestjs/common';
import { ConversationAppController } from './conversation-app.controller';
import { ConversationAppService } from './conversation-app.service';

@Module({
  controllers: [ConversationAppController],
  providers: [ConversationAppService],
  exports: [ConversationAppService],
})
export class ConversationAppModule {}
