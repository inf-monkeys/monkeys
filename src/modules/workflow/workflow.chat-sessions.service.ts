import { WorkflowChatSessionEntity } from '@/database/entities/workflow/workflow-chat-session';
import { Injectable } from '@nestjs/common';
import { WorkflowRepository } from '../../database/repositories/workflow.repository';

@Injectable()
export class WorkflowChatSessionService {
  constructor(private readonly workflowRepository: WorkflowRepository) {}

  public async createChatSession(teamId: string, userId: string, workflowId: string, displayName: string) {
    return await this.workflowRepository.createChatSession(teamId, userId, workflowId, displayName);
  }

  public async listChatSessions(teamId: string, workflowId: string) {
    return await this.workflowRepository.listChatSessions(teamId, workflowId);
  }

  public async deleteChatSession(teamId: string, sessionId: string) {
    return await this.workflowRepository.deleteChatSession(teamId, sessionId);
  }

  public async updateChatSession(teamId: string, sessionId: string, updates: Partial<WorkflowChatSessionEntity>) {
    return await this.workflowRepository.updateChatSession(teamId, sessionId, updates);
  }
}
