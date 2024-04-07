import { TeamEntity } from '@/database/entities/identity/team';
import { TeamRepository } from '@/database/repositories/team.repository';
import { Injectable } from '@nestjs/common';

export const DEFAULT_TEAM_DESCRIPTION = '用户很懒，还没留下描述';
export const DEFAULT_TEAM_PHOTO = 'https://static.aside.fun/upload/cnMh7q.jpg';

@Injectable()
export class TeamsService {
  constructor(private readonly teamRepository: TeamRepository) {}

  async getUserTeams(userId: string): Promise<TeamEntity[]> {
    return await this.teamRepository.getUserTeams(userId);
  }

  public async createTeam(userId: string, teamName: string, description?: string, logoUrl?: string, isBuiltIn = false, workflowTaskNamePrefix?: string, createMethod: 'self' | 'import' = 'self') {
    return await this.teamRepository.createTeam(userId, teamName, description, logoUrl, isBuiltIn, createMethod);
  }

  public async getTeamMembers(teamId: string) {
    return await this.teamRepository.getTeamMembers(teamId);
  }

  public async makeJoinTeamRequest(teamId: string, userId: string) {
    return await this.teamRepository.makeJoinTeamRequest(teamId, userId);
  }

  public async listJoinRequests(teamId: string) {
    return await this.teamRepository.listJoinRequests(teamId);
  }
}
