import { Module } from '@nestjs/common';
import { AssetsModule } from '../assets/assets.module';
import { ToolsModule } from '../tools/tools.module';
import { BootstrapService } from './bootstrap.service';

@Module({
  providers: [BootstrapService],
  imports: [ToolsModule, AssetsModule],
})
export class BootstrapModule {}
