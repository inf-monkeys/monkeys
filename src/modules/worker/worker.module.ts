import { Module } from '@nestjs/common';
import { ExampleModule } from './example/example.module';
import { WorkerController } from './worker.controller';
import { WorkerPollingService } from './worker.polling.service';
import { WorkerRegistryService } from './worker.registry.service';

@Module({
  controllers: [WorkerController],
  providers: [WorkerPollingService, WorkerRegistryService],
  imports: [ExampleModule],
  exports: [WorkerRegistryService],
})
export class WorkerModule {}
