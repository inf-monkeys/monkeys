import { EvaluationModule } from '@/modules/evaluation/evaluation.module';
import { ToolsModule } from '@/modules/tools/tools.module';
import { forwardRef, Module } from '@nestjs/common';
import { MediaBucketRegistryService } from './media.bucket-registry.service';
import { MediaFileCrudController } from './media.crud.controller';
import { MediaPresignService } from './media.presign.service';
import { MediaFileService } from './media.service';
import { MediaStorageService } from './media.storage.service';
import { MediaThumbnailService } from './media.thumbnail.service';
import { MediaUploadController } from './media.upload.controller';

@Module({
  controllers: [MediaUploadController, MediaFileCrudController],
  providers: [MediaFileService, MediaThumbnailService, MediaBucketRegistryService, MediaPresignService, MediaStorageService],
  imports: [forwardRef(() => EvaluationModule), ToolsModule],
  exports: [MediaFileService, MediaThumbnailService, MediaBucketRegistryService, MediaPresignService, MediaStorageService],
})
export class MediaModule {}
