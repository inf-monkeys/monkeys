import { Module } from '@nestjs/common';
import { ExampleModule } from './example/example.module';
import { WorkerController } from './worker.controller';
import { WorkerPollingService } from './worker.polling.service';
import { ToolsRegistryService } from './worker.registry.service';

@Module({
  controllers: [WorkerController],
  providers: [WorkerPollingService, ToolsRegistryService],
  imports: [ExampleModule],
  exports: [ToolsRegistryService],
})
export class WorkerModule {}
