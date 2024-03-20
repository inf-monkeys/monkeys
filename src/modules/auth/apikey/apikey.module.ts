import { Module } from '@nestjs/common';
import { ApikeyController } from './apikey.controller';
import { ApikeyService } from './apikey.service';

@Module({
  controllers: [ApikeyController],
  providers: [ApikeyService],
})
export class ApikeyModule {}
