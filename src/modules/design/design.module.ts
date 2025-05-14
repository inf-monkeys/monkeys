import { Module } from '@nestjs/common';
import { DesignController } from './design.controller';
import { DesignService } from './design.service';

@Module({
  controllers: [DesignController],
  providers: [DesignService],
  exports: [DesignService],
})
export class DesignModule {}
