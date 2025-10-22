import { GlobalWorkflowAssociationsEntity } from '@/database/entities/workflow/global-workflow-association';
import { UpdateAndCreateWorkflowAssociation, WorkflowAssociationsEntity } from '@/database/entities/workflow/workflow-association';
import { WorkflowRepository } from '@/database/repositories/workflow.repository';
import { Injectable, NotFoundException } from '@nestjs/common';
import { ExportedAllWorkflowAssociationEntity } from './workflow.association.crud.service';

@Injectable()
export class WorkflowAssociationService {
  constructor(private readonly workflowRepository: WorkflowRepository) {}

  async listAllWorkflowAssociations(teamId: string) {
    return await this.workflowRepository.listAllWorkflowAssociations(teamId);
  }

  async listWorkflowAssociations(workflowId: string, teamId: string) {
    return workflowId === 'global' ? await this.workflowRepository.listGlobalWorkflowAssociations(teamId) : await this.workflowRepository.listWorkflowAssociations(workflowId, teamId);
  }

  async getWorkflowAssociation(workflowAssociationId: string, relation = true): Promise<ExportedAllWorkflowAssociationEntity> {
    let result: GlobalWorkflowAssociationsEntity | WorkflowAssociationsEntity = await this.workflowRepository.getWorkflowAssociation(workflowAssociationId, relation);

    if (!result) {
      result = await this.getGlobalWorkflowAssociation(workflowAssociationId, relation);

      if (!result) {
        throw new NotFoundException('关联不存在');
      }

      return { ...result, scope: 'global' };
    }

    return { ...result, scope: 'specific' };
  }

  async getGlobalWorkflowAssociation(workflowAssociationId: string, relation = true) {
    return await this.workflowRepository.getGlobalWorkflowAssociation(workflowAssociationId, relation);
  }

  async createWorkflowAssociation(workflowId: string, teamId: string, createAssociation: UpdateAndCreateWorkflowAssociation) {
    return workflowId === 'global'
      ? await this.workflowRepository.createGlobalWorkflowAssociation(teamId, createAssociation)
      : await this.workflowRepository.createWorkflowAssociation(workflowId, teamId, createAssociation);
  }

  async updateWorkflowAssociation(id: string, scope: 'global' | string, teamId: string, updateAssociation: UpdateAndCreateWorkflowAssociation) {
    return scope === 'global'
      ? await this.workflowRepository.updateGlobalWorkflowAssociation(id, teamId, updateAssociation)
      : await this.workflowRepository.updateWorkflowAssociation(id, teamId, updateAssociation);
  }

  async removeWorkflowAssociation(id: string, scope: 'global' | string, teamId: string) {
    return scope === 'global' ? await this.workflowRepository.removeGlobalWorkflowAssociation(id, teamId) : await this.workflowRepository.removeWorkflowAssociation(id, teamId);
  }
}
