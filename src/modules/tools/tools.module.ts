import { Module } from '@nestjs/common';
import { ExampleToolsModule } from './example/example.module';
import { ToolsController } from './tools.controller';
import { ToolsPollingService } from './tools.polling.service';
import { ToolsRegistryService } from './tools.registry.service';

@Module({
  controllers: [ToolsController],
  providers: [ToolsPollingService, ToolsRegistryService],
  imports: [ExampleToolsModule],
  exports: [ToolsRegistryService],
})
export class ToolsModule {}
