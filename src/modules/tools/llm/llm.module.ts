import { MediaBucketRegistryService } from '@/modules/assets/media/media.bucket-registry.service';
import { MediaPresignService } from '@/modules/assets/media/media.presign.service';
import { MediaFileService } from '@/modules/assets/media/media.service';
import { MediaThumbnailService } from '@/modules/assets/media/media.thumbnail.service';
import { SqlKnowledgeBaseModule } from '@/modules/assets/sql-knowledge-base/sql-knowledge-base.module';
import { Module } from '@nestjs/common';
import { KnowledgeBaseModule } from '../../assets/knowledge-base/knowledge-base.module';
import { ToolsModule } from '../tools.module';
import { LlmController } from './llm.controller';
import { LlmService } from './llm.service';

@Module({
  controllers: [LlmController],
  providers: [LlmService, MediaFileService, MediaThumbnailService, MediaPresignService, MediaBucketRegistryService],
  imports: [ToolsModule, KnowledgeBaseModule, SqlKnowledgeBaseModule],
  exports: [LlmService],
})
export class LLMToolsModule {}
