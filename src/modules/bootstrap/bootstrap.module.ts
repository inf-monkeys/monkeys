import { Module } from '@nestjs/common';
import { ToolsModule } from '../tools/tools.module';
import { BootstrapService } from './bootstrap.service';

@Module({
  providers: [BootstrapService],
  imports: [ToolsModule],
})
export class BootstrapModule {}
