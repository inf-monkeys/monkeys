import { Module } from '@nestjs/common';
import { AssetsCommomService } from './assets.common.service';
import { AssetsFiltersController } from './assets.filter.controller';
import { AssetsFilterService } from './assets.filter.service';
import { AssetsPublishController } from './assets.publish.controller';
import { AssetsPublishService } from './assets.publish.service';
import { AssetsReferenceController } from './assets.reference.controller';
import { AssetsReferenceService } from './assets.reference.service';
import { AssetsTagController } from './assets.tag.controller';
import { AssetsTagService } from './assets.tag.service';
import { CanvasModule } from './canvas/canvas.module';
import { KnowledgeBaseModule } from './knowledge-base/knowledge-base.module';
import { MediaModule } from './media/media.module';
import { KnowledgeBaseSqlModule } from './knowledge-base-sql/knowledge-base-sql.module';

@Module({
  controllers: [AssetsFiltersController, AssetsPublishController, AssetsTagController, AssetsReferenceController],
  providers: [AssetsFilterService, AssetsPublishService, AssetsTagService, AssetsCommomService, AssetsReferenceService],
  imports: [CanvasModule, MediaModule, KnowledgeBaseModule, KnowledgeBaseSqlModule],
})
export class AssetsModule {}
