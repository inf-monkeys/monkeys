import { Module } from '@nestjs/common';
import { OneAPIController } from './oneapi.controller';
import { OneAPIService } from './oneapi.service';

@Module({
  providers: [OneAPIService],
  controllers: [OneAPIController],
})
export class OneAPIModule {}
