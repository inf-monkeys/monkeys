import { Module } from '@nestjs/common';
import { WorkflowModule } from '../workflow/workflow.module';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';

@Module({
  controllers: [ExportController],
  providers: [ExportService],
  imports: [WorkflowModule],
})
export class ExportModule {}
