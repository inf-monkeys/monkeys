import { MarketplaceAppVersionEntity } from '@/database/entities/marketplace/marketplace-app-version.entity';
import { MarketplaceAppEntity } from '@/database/entities/marketplace/marketplace-app.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetsModule } from '../assets/assets.module';
import { AuthModule } from '../auth/auth.module';
import { MarketplaceModule } from '../marketplace/marketplace.module';
import { ToolsModule } from '../tools/tools.module';
import { BootstrapService } from './bootstrap.service';

@Module({
  providers: [BootstrapService],
  imports: [ToolsModule, AssetsModule, MarketplaceModule, TypeOrmModule.forFeature([MarketplaceAppEntity, MarketplaceAppVersionEntity]), AuthModule],
})
export class BootstrapModule {}
