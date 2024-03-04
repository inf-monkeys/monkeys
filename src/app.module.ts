import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WorkerModule } from './modules/worker/worker.module';

@Module({
  imports: [WorkerModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
