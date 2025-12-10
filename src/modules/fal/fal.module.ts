import { Module } from '@nestjs/common';
import { FalProxyController } from './fal.proxy.controller';

@Module({
  controllers: [FalProxyController],
  providers: [],
})
export class FalModule {}
