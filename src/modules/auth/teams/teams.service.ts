import { config } from '@/common/config';
import { logger } from '@/common/logger';
import { ComfyuiWorkflowEntity } from '@/database/entities/comfyui/comfyui-workflow.entity';
import { CustomConfigs, CustomTheme, TeamEntity, TeamInitStatusEnum } from '@/database/entities/identity/team';
import { AssetsMarketPlaceRepository } from '@/database/repositories/assets-marketplace.repository';
import { TeamRepository } from '@/database/repositories/team.repository';
import { ComfyuiModelService } from '@/modules/assets/comfyui-model/comfyui-model.service';
import { DesignMetadataService } from '@/modules/design/design.metadata.service';
import { DesignProjectService } from '@/modules/design/design.project.service';
import { MarketplaceService } from '@/modules/marketplace/services/marketplace.service';
import { ConductorService } from '@/modules/workflow/conductor/conductor.service';
import { WorkflowCrudService } from '@/modules/workflow/workflow.curd.service';
import { WorkflowPageService } from '@/modules/workflow/workflow.page.service';
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import axios from 'axios';
import { EventEmitter } from 'events';
import { pick } from 'lodash';

export const DEFAULT_TEAM_DESCRIPTION = '用户很懒，还没留下描述';
export const DEFAULT_TEAM_PHOTO = 'https://static.aside.fun/upload/cnMh7q.jpg';

@Injectable()
export class TeamsService extends EventEmitter {
  constructor(
    private readonly teamRepository: TeamRepository,
    private readonly marketPlaceRepository: AssetsMarketPlaceRepository,
    private readonly conductorService: ConductorService,
    private readonly comfyuiModelService: ComfyuiModelService,
    private readonly designProjectService: DesignProjectService,
    private readonly designMetadataService: DesignMetadataService,
    private readonly pageService: WorkflowPageService,
    private readonly marketplaceService: MarketplaceService,
    private readonly workflowCrudService: WorkflowCrudService,
  ) {
    super();
  }

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

  public async initTeam(teamId: string, userId: string, deleteAllAssets = false) {
    await this.updateTeamInitStatus(teamId, TeamInitStatusEnum.PENDING);

    try {
      // 先清空页面组和固定页面
      await this.pageService.clearTeamPageGroupsAndPinnedPages(teamId);

      if (deleteAllAssets) {
        await this.workflowCrudService.deleteWorkflowDef(teamId, '*');
      }

      // Init assets from built-in marketplace
      await this.marketplaceService.installPresetApps(teamId, userId);

      // Check if the default server can connect
      const isDefaultServerCanConnect = await this.comfyuiModelService.isDefaultServerCanConnect();
      if (isDefaultServerCanConnect) {
        // 初始化内置图像模型类型
        await this.comfyuiModelService.updateTypesFromInternals(teamId);
        // 自动更新内置图像模型列表
        await this.comfyuiModelService.updateModelsByTeamIdAndServerId(teamId, 'default');
        // 自动更新图像模型列表类型
        await this.comfyuiModelService.updateModelsFromInternals(teamId);
      }

      setTimeout(() => {
        this.updateTeamInitStatus(teamId, TeamInitStatusEnum.SUCCESS);
      }, 10000);

      // initTeam webhook
      const webhookUrl = config.server.webhook.initTeam;
      if (webhookUrl) {
        const result = await axios.post(
          webhookUrl,
          {
            teamId,
            userId,
          },
          {
            headers: {
              Authorization: `Bearer ${config.server.webhook.token}`,
            },
          },
        );
        return result.data;
      }
      return null;
    } catch (error) {
      await this.updateTeamInitStatus(teamId, TeamInitStatusEnum.FAILED);
      throw error;
    }
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
      configs?: CustomConfigs;
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

  /**
   * 获取团队初始化状态
   */
  public async getTeamInitStatus(teamId: string, userId: string): Promise<TeamInitStatusEnum | undefined> {
    const team = await this.teamRepository.getTeamById(teamId);
    if (!team) {
      throw new NotFoundException('团队不存在');
    }

    // 检查用户是否有权限查看该团队
    const userTeams = await this.getUserTeams(userId);
    if (!userTeams.some((t) => t.id === teamId)) {
      throw new ForbiddenException('您没有权限查看该团队状态');
    }

    return team.initStatus;
  }

  /**
   * 订阅团队状态变化
   */
  public async subscribeToTeamStatus(teamId: string, userId: string, callback: (status: TeamInitStatusEnum | undefined) => void): Promise<() => void> {
    // 检查权限
    const userTeams = await this.getUserTeams(userId);
    if (!userTeams.some((t) => t.id === teamId)) {
      throw new Error('您没有权限查看该团队状态');
    }

    const eventName = `team-status-${teamId}`;

    // 添加监听器
    this.on(eventName, callback);

    // 发送当前状态
    const currentStatus = await this.getTeamInitStatus(teamId, userId);
    callback(currentStatus);

    // 返回取消订阅函数
    return () => {
      this.removeListener(eventName, callback);
    };
  }

  /**
   * 更新团队初始化状态
   */
  public async updateTeamInitStatus(teamId: string, status: TeamInitStatusEnum): Promise<void> {
    await this.teamRepository.updateTeamInitStatus(teamId, status);

    // 发送状态变化事件
    this.emit(`team-status-${teamId}`, status);
  }
}
