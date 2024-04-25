import { Module } from '@nestjs/common';
import { AssetsCommomService } from './assets.common.service';
import { AssetsFiltersController } from './assets.filter.controller';
import { AssetsFilterService } from './assets.filter.service';
import { AssetsMarketplaceController } from './assets.marketplace.controller';
import { AssetsMarketplaceService } from './assets.marketplace.service';
import { AssetsPublishController } from './assets.publish.controller';
import { AssetsPublishService } from './assets.publish.service';
import { AssetsReferenceController } from './assets.reference.controller';
import { AssetsReferenceService } from './assets.reference.service';
import { AssetsTagController } from './assets.tag.controller';
import { AssetsTagService } from './assets.tag.service';
import { CanvasModule } from './canvas/canvas.module';
import { KnowledgeBaseSqlModule } from './knowledge-base-sql/knowledge-base-sql.module';
import { KnowledgeBaseModule } from './knowledge-base/knowledge-base.module';
import { LlmModelModule } from './llm-model/llm-model.module';
import { MediaModule } from './media/media.module';
import { SdModelModule } from './sd-model/sd-model.module';

@Module({
  controllers: [AssetsFiltersController, AssetsPublishController, AssetsTagController, AssetsReferenceController, AssetsMarketplaceController],
  providers: [AssetsFilterService, AssetsPublishService, AssetsTagService, AssetsCommomService, AssetsReferenceService, AssetsMarketplaceService],
  imports: [CanvasModule, MediaModule, KnowledgeBaseModule, KnowledgeBaseSqlModule, LlmModelModule, SdModelModule],
  exports: [AssetsMarketplaceService],
})
export class AssetsModule {}
