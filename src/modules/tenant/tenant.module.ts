import { WorkflowExecutionEntity } from '@/database/entities/workflow/workflow-execution';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConductorService } from '../workflow/conductor/conductor.service';
import { WorkflowModule } from '../workflow/workflow.module';
import { TenantController } from './tenant.controller';
import { TenantService } from './tenant.service';

@Module({
  controllers: [TenantController],
  providers: [TenantService, ConductorService],
  imports: [TypeOrmModule.forFeature([WorkflowExecutionEntity]), WorkflowModule],
})
export class TenantModule {}
