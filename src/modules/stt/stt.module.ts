import { Module } from '@nestjs/common'
import { SttController } from './stt.controller'

@Module({
  controllers: [SttController],
})
export class SttModule {}


