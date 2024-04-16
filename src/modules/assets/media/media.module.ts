import { Module } from '@nestjs/common';
import { MediaFileCrudController } from './media.crud.controller';
import { MediaFileService } from './media.service';
import { MediaUploadController } from './media.upload.controller';

@Module({
  controllers: [MediaUploadController, MediaFileCrudController],
  providers: [MediaFileService],
})
export class MediaModule {}
