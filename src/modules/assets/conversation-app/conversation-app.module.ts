import { Module } from '@nestjs/common';
import { ConversationAppController } from './conversation-app.controller';
import { ConversationAppService } from './conversation-app.service';
import { ConversationStatisticsService } from './conversation-app.statstics.service';

@Module({
  controllers: [ConversationAppController],
  providers: [ConversationAppService, ConversationStatisticsService],
  exports: [ConversationAppService, ConversationStatisticsService],
})
export class ConversationAppModule {}
