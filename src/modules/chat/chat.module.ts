import { Module } from '@nestjs/common';
import { WorkflowModule } from '../workflow/workflow.module';
import { WorkflowOpenAICompatibleController } from './chat.controller';

@Module({
  controllers: [WorkflowOpenAICompatibleController],
  imports: [WorkflowModule],
})
export class ChatModule {}
