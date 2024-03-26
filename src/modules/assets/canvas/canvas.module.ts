import { Module } from '@nestjs/common';
import { CanvasController } from './canvas.controller';
import { CanvasService } from './canvas.service';

@Module({
  controllers: [CanvasController],
  providers: [CanvasService]
})
export class CanvasModule {}
