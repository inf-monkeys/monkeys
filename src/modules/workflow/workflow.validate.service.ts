import { WorkflowOutputValue } from '@/entities/workflow/workflow-metadata';
import { WorkflowTask } from '@io-orkes/conductor-javascript';
import { Injectable } from '@nestjs/common';
import { ToolsRepository } from '../../repositories/tools.repository';
import { WorkflowValidator } from './workflow-validator';

@Injectable()
export class WorkflowValidateService {
  constructor(private readonly toolsRepository: ToolsRepository) {}

  public async validateWorkflow(tasks: WorkflowTask[], output: WorkflowOutputValue[]) {
    const tools = await this.toolsRepository.listTools();
    const issues = WorkflowValidator.validateWorkflow(tasks, output, tools as any[]);
    return issues;
  }
}
