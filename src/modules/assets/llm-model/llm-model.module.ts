import { Module } from '@nestjs/common';
import { LlmModelController } from './llm-model.controller';
import { LlmModelService } from './llm-model.service';

@Module({
  providers: [LlmModelService],
  controllers: [LlmModelController],
})
export class LlmModelModule {}
