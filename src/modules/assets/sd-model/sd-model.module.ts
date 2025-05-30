import { Module } from '@nestjs/common';
import { SdModelController } from './sd-model.controller';
import { SdModelService } from './sd-model.service';

@Module({
  controllers: [SdModelController],
  providers: [SdModelService],
})
export class SdModelModule {}
