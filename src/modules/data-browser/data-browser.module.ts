import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataBrowserController } from './data-browser.controller';
import { DataBrowserService } from './data-browser.service';
import { DataAssetEntity } from '@/database/entities/data-management/data-asset.entity';
import { DataViewEntity } from '@/database/entities/data-management/data-view.entity';
import { DataAssetRepository } from '@/database/repositories/data-asset.repository';
import { DataViewRepository } from '@/database/repositories/data-view.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DataViewEntity,
      DataAssetEntity,
    ]),
  ],
  controllers: [DataBrowserController],
  providers: [
    DataBrowserService,
    DataAssetRepository,
    DataViewRepository,
  ],
  exports: [DataBrowserService],
})
export class DataBrowserModule {}
