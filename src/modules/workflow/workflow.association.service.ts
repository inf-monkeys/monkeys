import { UpdateAndCreateWorkflowAssociation } from '@/database/entities/workflow/workflow-association';
import { WorkflowRepository } from '@/database/repositories/workflow.repository';
import { Injectable } from '@nestjs/common';

@Injectable()
export class WorkflowAssociationService {
  constructor(private readonly workflowRepository: WorkflowRepository) {}

  async listAllWorkflowAssociations(teamId: string) {
    return await this.workflowRepository.listAllWorkflowAssociations(teamId);
  }

  async listWorkflowAssociations(workflowId: string, teamId: string) {
    return await this.workflowRepository.listWorkflowAssociations(workflowId, teamId);
  }

  async getWorkflowAssociation(workflowAssociationId: string, relation = true) {
    return await this.workflowRepository.getWorkflowAssociation(workflowAssociationId, relation);
  }

  async createWorkflowAssociation(workflowId: string, teamId: string, createAssociation: UpdateAndCreateWorkflowAssociation) {
    return await this.workflowRepository.createWorkflowAssociation(workflowId, teamId, createAssociation);
  }

  async updateWorkflowAssociation(id: string, teamId: string, updateAssociation: UpdateAndCreateWorkflowAssociation) {
    return await this.workflowRepository.updateWorkflowAssociation(id, teamId, updateAssociation);
  }

  async removeWorkflowAssociation(id: string, teamId: string) {
    return await this.workflowRepository.removeWorkflowAssociation(id, teamId);
  }
}
