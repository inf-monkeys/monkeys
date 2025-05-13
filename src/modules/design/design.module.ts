import { Module } from '@nestjs/common';
import { DesignService } from './design.service';
import { DesignController } from './design.controller';

@Module({
  controllers: [DesignController],
  providers: [DesignService],
})
export class DesignModule {}
