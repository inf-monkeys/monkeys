import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BlockModule } from './modules/block/block.module';
import { DatabaseModule } from './modules/infra/database/database.module';
import { WorkerModule } from './modules/worker/worker.module';

@Module({
  imports: [DatabaseModule, WorkerModule, BlockModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
