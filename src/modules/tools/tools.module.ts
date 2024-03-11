import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { BuiltinToolsModule } from './builtin/builtin.module';
import { ExampleToolsModule } from './example/example.module';
import { ToolsController } from './tools.controller';
import { ToolsForwardService } from './tools.forward.service';
import { ToolsPollingService } from './tools.polling.service';
import { ToolsRegistryService } from './tools.registry.service';

@Module({
  controllers: [ToolsController],
  providers: [ToolsPollingService, ToolsRegistryService, ToolsForwardService],
  imports: [ExampleToolsModule, HttpModule, BuiltinToolsModule],
  exports: [ToolsRegistryService],
})
export class ToolsModule {}
