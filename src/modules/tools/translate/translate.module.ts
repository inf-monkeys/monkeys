import { Module } from '@nestjs/common';
import { TranslateToolsController } from './translate.controller';

@Module({
  controllers: [TranslateToolsController],
})
export class TranslateToolsModule {}
