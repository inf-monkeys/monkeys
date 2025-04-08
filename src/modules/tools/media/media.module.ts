import { Module } from '@nestjs/common';
import { MediaToolsController } from './media.controller';

@Module({
  controllers: [MediaToolsController],
})
export class MediaToolsModule { }
