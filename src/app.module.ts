import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WorkerModule } from './modules/worker/worker.module';
import { BlockModule } from './modules/block/block.module';

@Module({
  imports: [WorkerModule, BlockModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
