import { TemporaryWorkflowEntity } from '@/database/entities/workflow/temporary-workflow.entity';
import { WorkflowExecutionEntity } from '@/database/entities/workflow/workflow-execution';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkflowModule } from '../workflow/workflow.module';
import { TemporaryWorkflowService } from './temporary-workflow.service';

@Module({
  controllers: [],
  providers: [TemporaryWorkflowService],
  imports: [TypeOrmModule.forFeature([WorkflowExecutionEntity, TemporaryWorkflowEntity]), WorkflowModule],
  exports: [TemporaryWorkflowService],
})
export class TemporaryWorkflowModule {}
