import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { BuiltinToolsModule } from './builtin/builtin.module';
import { ExampleToolsModule } from './example/example.module';
import { ToolsController } from './tools.controller';
import { ToolsCredentialsController } from './tools.credential.controller';
import { ToolsCredentialsService } from './tools.credential.service';
import { ToolsForwardService } from './tools.forward.service';
import { ToolsPollingService } from './tools.polling.service';
import { ToolsRegistryService } from './tools.registry.service';

@Module({
  controllers: [ToolsController, ToolsCredentialsController],
  providers: [ToolsPollingService, ToolsRegistryService, ToolsForwardService, ToolsCredentialsService],
  imports: [ExampleToolsModule, HttpModule, BuiltinToolsModule],
  exports: [ToolsRegistryService, ToolsForwardService],
})
export class ToolsModule {}
