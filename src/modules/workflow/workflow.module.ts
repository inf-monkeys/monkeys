import { Module } from '@nestjs/common';
import { WorkflowCrudController } from './workflow.crud.controller';
import { WorkflowCrudService } from './workflow.curd.service';
import { WorkflowExecutionController } from './workflow.execution.controller';
import { WorkflowExecutionService } from './workflow.execution.service';
import { WorkflowValidateController } from './workflow.validate.controller';
import { WorkflowValidateService } from './workflow.validate.service';

@Module({
  controllers: [WorkflowCrudController, WorkflowValidateController, WorkflowExecutionController],
  providers: [WorkflowCrudService, WorkflowValidateService, WorkflowExecutionService],
})
export class WorkflowModule {}
