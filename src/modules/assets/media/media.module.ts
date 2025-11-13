import { EvaluationModule } from '@/modules/evaluation/evaluation.module';
import { ToolsModule } from '@/modules/tools/tools.module';
import { forwardRef, Module } from '@nestjs/common';
import { MediaFileCrudController } from './media.crud.controller';
import { MediaFileService } from './media.service';
import { MediaThumbnailService } from './media.thumbnail.service';
import { MediaUploadController } from './media.upload.controller';

@Module({
  controllers: [MediaUploadController, MediaFileCrudController],
  providers: [MediaFileService, MediaThumbnailService],
  imports: [forwardRef(() => EvaluationModule), ToolsModule],
  exports: [MediaFileService, MediaThumbnailService],
})
export class MediaModule {}
