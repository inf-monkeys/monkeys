import { Module } from '@nestjs/common';
import { ResourceCrudController } from './media.crud.controller';
import { MediaService } from './media.service';
import { MediaUploadController } from './media.upload.controller';

@Module({
  controllers: [MediaUploadController, ResourceCrudController],
  providers: [MediaService],
})
export class MediaModule {}
