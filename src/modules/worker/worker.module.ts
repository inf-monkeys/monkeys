import { Module } from '@nestjs/common';
import { ExampleModule } from './example/example.module';
import { WorkerController } from './worker.controller';
import { WorkerService } from './worker.service';

@Module({
  controllers: [WorkerController],
  providers: [WorkerService],
  imports: [ExampleModule],
})
export class WorkerModule {}
