import { CustomTheme, TeamEntity } from '@/database/entities/identity/team';
import { AssetsMarketPlaceRepository } from '@/database/repositories/assets-marketplace.repository';
import { TeamRepository } from '@/database/repositories/team.repository';
import { ConductorService } from '@/modules/workflow/conductor/conductor.service';
import { Injectable } from '@nestjs/common';

export const DEFAULT_TEAM_DESCRIPTION = '用户很懒，还没留下描述';
export const DEFAULT_TEAM_PHOTO = 'https://static.aside.fun/upload/cnMh7q.jpg';

@Injectable()
export class TeamsService {
  constructor(
    private readonly teamRepository: TeamRepository,
    private readonly marketPlaceRepository: AssetsMarketPlaceRepository,
    private readonly conductorService: ConductorService,
  ) {}

  private async forkAssetsFromMarketPlace(teamId: string, userId: string) {
    const clonedWorfklows = await this.marketPlaceRepository.forkBuiltInWorkflowAssetsFromMarketPlace(teamId, userId);
    for (const workflow of clonedWorfklows) {
      try {
        await this.conductorService.saveWorkflowInConductor(workflow);
      } catch (e) {
        console.error('Failed to save workflow in conductor', e);
      }
    }
  }

  async getUserTeams(userId: string): Promise<TeamEntity[]> {
    return await this.teamRepository.getUserTeams(userId);
  }

  public async createTeam(userId: string, teamName: string, description?: string, iconUrl?: string, isBuiltIn = false, workflowTaskNamePrefix?: string, createMethod: 'self' | 'import' = 'self') {
    const team = await this.teamRepository.createTeam(userId, teamName, description, iconUrl, isBuiltIn, createMethod);
    // Init assets from built-in marketplace
    this.forkAssetsFromMarketPlace(team.id, userId);
  }

  public async updateTeam(
    teamId: string,
    updates?: {
      name?: string;
      description?: string;
      iconUrl?: string;
      customTheme?: CustomTheme;
    },
  ) {
    return await this.teamRepository.updateTeam(teamId, updates);
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
