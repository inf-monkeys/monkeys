import { ListDto } from '@/common/dto/list.dto';
import { CreateConversationAppParams, UpdateConversationAppParams } from '@/database/entities/conversation-app/conversation-app.entity';
import { ConversationAppRepository } from '@/database/repositories/conversation-app.repository';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ConversationAppService {
  constructor(private readonly conversationAppRepository: ConversationAppRepository) {}

  public async listConversationApps(teamId: string, dto: ListDto) {
    return await this.conversationAppRepository.listConversationApps(teamId, dto);
  }

  public async getConversationAppById(teamId: string, id: string) {
    return await this.conversationAppRepository.getConversationAppById(teamId, id);
  }

  public async createConversationApp(teamId: string, creatorUserId: string, body: CreateConversationAppParams) {
    return await this.conversationAppRepository.createConversationApp(teamId, creatorUserId, body);
  }

  public async updateConversationApp(teamId: string, id: string, updates: UpdateConversationAppParams) {
    return await this.conversationAppRepository.updateConversationApp(teamId, id, updates);
  }

  public async deleteConversationApp(teamId: string, id: string) {
    await this.conversationAppRepository.deleteConversationApp(teamId, id);
  }
}
