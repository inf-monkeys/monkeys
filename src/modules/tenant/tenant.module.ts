import { TemporaryWorkflowEntity } from '@/database/entities/workflow/temporary-workflow.entity';
import { WorkflowExecutionEntity } from '@/database/entities/workflow/workflow-execution';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeamsModule } from '../auth/teams/teams.module';
import { TemporaryWorkflowModule } from '../temporary-workflow/temporary-workflow.module';
import { ConductorService } from '../workflow/conductor/conductor.service';
import { WorkflowArtifactService } from '../workflow/workflow.artifact.service';
import { WorkflowModule } from '../workflow/workflow.module';
import { TenantController } from './tenant.controller';
import { TenantManageController } from './tenant.manage.controller';
import { TenantManageService } from './tenant.manage.service';
import { TenantService } from './tenant.service';

@Module({
  controllers: [TenantController, TenantManageController],
  providers: [TenantService, ConductorService, TenantManageService, WorkflowArtifactService],
  imports: [TypeOrmModule.forFeature([WorkflowExecutionEntity, TemporaryWorkflowEntity]), WorkflowModule, TemporaryWorkflowModule, TeamsModule],
  exports: [TenantService],
})
export class TenantModule {}
