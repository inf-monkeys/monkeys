import { TemporaryWorkflowEntity } from '@/database/entities/workflow/temporary-workflow.entity';
import { WorkflowExecutionEntity } from '@/database/entities/workflow/workflow-execution';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConductorModule } from '../workflow/conductor/conductor.module';
import { WorkflowModule } from '../workflow/workflow.module';
import { TemporaryWorkflowController } from './temporary-workflow.controller';
import { TemporaryWorkflowService } from './temporary-workflow.service';

@Module({
  controllers: [TemporaryWorkflowController],
  providers: [TemporaryWorkflowService],
  imports: [TypeOrmModule.forFeature([WorkflowExecutionEntity, TemporaryWorkflowEntity]), WorkflowModule, ConductorModule],
  exports: [TemporaryWorkflowService],
})
export class TemporaryWorkflowModule {}
