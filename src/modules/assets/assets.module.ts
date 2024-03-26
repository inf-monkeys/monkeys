import { Module } from '@nestjs/common';
import { AssetsFiltersController } from './assets.filter.controller';
import { AssetsFilterService } from './assets.filter.service';
import { AssetsPublishController } from './assets.publish.controller';
import { AssetsPublishService } from './assets.publish.service';
import { CanvasModule } from './canvas/canvas.module';

@Module({
  controllers: [AssetsFiltersController, AssetsPublishController],
  providers: [AssetsFilterService, AssetsPublishService],
  imports: [CanvasModule],
})
export class AssetsModule {}
