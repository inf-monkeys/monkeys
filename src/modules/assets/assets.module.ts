import { Module } from '@nestjs/common';
import { AssetsCommomService } from './assets.common.service';
import { AssetsFiltersController } from './assets.filter.controller';
import { AssetsFilterService } from './assets.filter.service';
import { AssetsPublishController } from './assets.publish.controller';
import { AssetsPublishService } from './assets.publish.service';
import { AssetsTagController } from './assets.tag.controller';
import { AssetsTagService } from './assets.tag.service';
import { CanvasModule } from './canvas/canvas.module';

@Module({
  controllers: [AssetsFiltersController, AssetsPublishController, AssetsTagController],
  providers: [AssetsFilterService, AssetsPublishService, AssetsTagService, AssetsCommomService],
  imports: [CanvasModule],
})
export class AssetsModule {}