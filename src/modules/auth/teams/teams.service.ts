import { logger } from '@/common/logger';
import { ComfyuiWorkflowEntity } from '@/database/entities/comfyui/comfyui-workflow.entity';
import { CustomTheme, TeamEntity } from '@/database/entities/identity/team';
import { AssetsMarketPlaceRepository } from '@/database/repositories/assets-marketplace.repository';
import { TeamRepository } from '@/database/repositories/team.repository';
import { ComfyuiModelService } from '@/modules/assets/comfyui-model/comfyui-model.service';
import { DesignProjectService } from '@/modules/design/design.project.service';
import { ConductorService } from '@/modules/workflow/conductor/conductor.service';
import { Injectable } from '@nestjs/common';
import { pick } from 'lodash';

export const DEFAULT_TEAM_DESCRIPTION = '用户很懒，还没留下描述';
export const DEFAULT_TEAM_PHOTO = 'https://static.aside.fun/upload/cnMh7q.jpg';

@Injectable()
export class TeamsService {
  constructor(
    private readonly teamRepository: TeamRepository,
    private readonly marketPlaceRepository: AssetsMarketPlaceRepository,
    private readonly conductorService: ConductorService,
    private readonly comfyuiModelService: ComfyuiModelService,
    private readonly designProjectService: DesignProjectService,
  ) {}

  public async forkAssetsFromMarketPlace(teamId: string, userId: string) {
    const clonedComfyuiWorkflows = (await this.marketPlaceRepository.forkBuiltInComfyuiWorkflowAssetsFromMarketPlace(teamId, userId)) as (ComfyuiWorkflowEntity & { forkFromId: string })[];
    const clonedWorkflows = await this.marketPlaceRepository.forkBuiltInWorkflowAssetsFromMarketPlace(teamId, userId, {
      clonedComfyuiWorkflows,
    });
    for (const workflow of clonedWorkflows) {
      try {
        await this.conductorService.saveWorkflowInConductor(workflow);
      } catch (e) {
        logger.error('Failed to save workflow in conductor', e);
      }
    }
  }

  async getUserTeams(userId: string): Promise<TeamEntity[]> {
    return await this.teamRepository.getUserTeams(userId);
  }

  public async getTeamBriefById(teamId: string) {
    return pick(await this.teamRepository.getTeamById(teamId), ['id', 'name', 'description', 'logoUrl']) as TeamEntity;
  }

  public async initTeam(teamId: string, userId: string) {
    // Init assets from built-in marketplace
    await this.forkAssetsFromMarketPlace(teamId, userId);
    // 初始化内置图像模型类型
    await this.comfyuiModelService.updateTypesFromInternals(teamId);
    // 自动更新内置图像模型列表
    await this.comfyuiModelService.updateModelsByTeamIdAndServerId(teamId, 'default');
    // 自动更新图像模型列表类型
    await this.comfyuiModelService.updateModelsFromInternals(teamId);
    // TEMP TODO: 默认新建一个画板
    await this.designProjectService.create({
      teamId,
      creatorUserId: userId,
      sortIndex: 0,
      assetType: 'design-board',
      displayName: 'Design Board',
      createdTimestamp: Date.now(),
      updatedTimestamp: Date.now(),
    });
    return;
  }

  public async createTeam(
    userId: string,
    teamName: string,
    description?: string,
    iconUrl?: string,
    isBuiltIn = false,
    createMethod: 'self' | 'import' = 'self',
    initialTeamId?: string,
    darkmodeIconUrl?: string,
  ) {
    const team = await this.teamRepository.createTeam(userId, teamName, description, iconUrl, isBuiltIn, createMethod, initialTeamId, darkmodeIconUrl);
    await this.initTeam(team.id, userId);
    return team;
  }

  public async updateTeam(
    teamId: string,
    updates?: {
      name?: string;
      description?: string;
      iconUrl?: string;
      customTheme?: CustomTheme;
      darkmodeIconUrl?: string;
    },
  ) {
    return await this.teamRepository.updateTeam(teamId, updates);
  }

  public async deleteTeam(teamId: string, userId: string) {
    const team = await this.teamRepository.getTeamById(teamId);
    if (team.isBuiltIn) {
      throw new Error('内建团队不可删除');
    }

    if (team.ownerUserId !== userId) {
      throw new Error('只有团队创建者才能删除团队');
    }

    const result = await this.teamRepository.deleteTeam(teamId);

    const userTeams = await this.teamRepository.getUserTeams(userId);
    if (!userTeams.length) {
      const defaultTeamName = `团队 ${userId}`;
      await this.createTeam(userId, defaultTeamName, DEFAULT_TEAM_DESCRIPTION, DEFAULT_TEAM_PHOTO, true);
    }

    return result;
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

  public async createTeamInviteId(teamId: string, inviterUserId: string, outdateType: number, targetUserId?: string) {
    return await this.teamRepository.createTeamInviteId(teamId, inviterUserId, outdateType, targetUserId);
  }

  public async getTeamInvites(teamId: string) {
    return await this.teamRepository.getTeamInvites(teamId);
  }

  public async updateTeamInviteRemark(inviteId: string, remark: string) {
    return await this.teamRepository.updateTeamInviteRemark(inviteId, remark);
  }

  public async toggleForeverTeamInviteLinkStatus(inviteId: string) {
    return await this.teamRepository.toggleForeverTeamInviteLinkStatus(inviteId);
  }

  public async deleteTeamInvite(inviteId: string) {
    return await this.teamRepository.deleteTeamInvite(inviteId);
  }

  public async getTeamInviteById(inviteId: string) {
    return await this.teamRepository.getTeamInviteById(inviteId);
  }

  public async acceptTeamInvite(userId: string, inviteId: string) {
    return await this.teamRepository.acceptTeamInvite(userId, inviteId);
  }

  public async removeTeamMember(teamId: string, userId: string, removeUserId: string) {
    const team = await this.teamRepository.getTeamById(teamId);
    if (team.ownerUserId === userId) {
      if (team.ownerUserId === removeUserId) {
        throw new Error('不能移除团队创建者');
      }

      return await this.teamRepository.removeTeamMember(teamId, removeUserId);
    } else {
      throw new Error('你不是团队拥有者，无法移除团队成员');
    }
  }
}
