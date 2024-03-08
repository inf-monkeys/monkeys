import { Module } from '@nestjs/common';
import { ConductorService } from './conductor.service';

@Module({
  providers: [ConductorService],
  exports: [ConductorService],
})
export class ConductorModule {}
