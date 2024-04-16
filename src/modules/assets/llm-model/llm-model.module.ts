import { Module } from '@nestjs/common';
import { LlmModelService } from './llm-model.service';
import { LlmModelController } from './llm-model.controller';

@Module({
  providers: [LlmModelService],
  controllers: [LlmModelController]
})
export class LlmModelModule {}
