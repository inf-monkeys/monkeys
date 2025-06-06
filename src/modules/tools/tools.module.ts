import { TranslateToolsModule } from '@/modules/tools/translate/translate.module';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ComfyUIModule } from './comfyui/comfyui.module';
import { ExampleToolsModule } from './example/example.module';
import { MediaToolsModule } from './media/media.module';
import { OneAPIModule } from './oneapi/oneapi.module';
import { ToolsController } from './tools.controller';
import { ToolsCredentialsController } from './tools.credential.controller';
import { ToolsCredentialsService } from './tools.credential.service';
import { ToolsForwardService } from './tools.forward.service';
import { ToolsPollingService } from './tools.polling.service';
import { ToolsRegistryService } from './tools.registry.service';

@Module({
  controllers: [ToolsController, ToolsCredentialsController],
  providers: [ToolsPollingService, ToolsRegistryService, ToolsForwardService, ToolsCredentialsService],
  imports: [ExampleToolsModule, HttpModule, ComfyUIModule, OneAPIModule, TranslateToolsModule, MediaToolsModule],
  exports: [ToolsRegistryService, ToolsForwardService],
})
export class ToolsModule {}
