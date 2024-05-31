import { WorkflowOutputValue } from '@/database/entities/workflow/workflow-metadata';
import { WorkflowTask } from '@inf-monkeys/conductor-javascript';
import { Injectable } from '@nestjs/common';
import { ToolsRepository } from '../../database/repositories/tools.repository';
import { WorkflowValidator } from './workflow-validator';

@Injectable()
export class WorkflowValidateService {
  constructor(private readonly toolsRepository: ToolsRepository) {}

  public async validateWorkflow(teamId: string, tasks: WorkflowTask[], output: WorkflowOutputValue[]) {
    const tools = await this.toolsRepository.listTools(teamId);
    const issues = WorkflowValidator.validateWorkflow(tasks, output, tools as any[]);
    return issues;
  }
}
