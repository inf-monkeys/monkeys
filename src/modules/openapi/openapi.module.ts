import { Module } from '@nestjs/common';
import { WorkflowModule } from '../workflow/workflow.module';

@Module({
  imports: [WorkflowModule],
})
export class OpenapiModule {}
