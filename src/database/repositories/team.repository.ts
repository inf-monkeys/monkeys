import { S3Helpers } from '@/common/s3';
import { generateDbId } from '@/common/utils';
import { getMap } from '@/common/utils/map';
import { CustomTheme, TeamEntity } from '@/database/entities/identity/team';
import { TeamMembersEntity } from '@/database/entities/identity/user-team-relationship';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import _, { uniq } from 'lodash';
import { In, Repository } from 'typeorm';
import { TeamJoinRequestsEntity, TeamJoinRequestStatus } from '../entities/identity/team-join-request';
import { UserEntity } from '../entities/identity/user';
import { ApikeyRepository } from './apikey.repository';
import { UserRepository } from './user.repository';
import { TeamInviteLinkOutdateType, TeamInvitesRequestsEntity, TeamInviteStatus, TeamInviteType } from '@/database/entities/identity/team-invites';
import dayjs from 'dayjs';

@Injectable()
export class TeamRepository {
  constructor(
    @InjectRepository(TeamEntity)
    private readonly teamRepository: Repository<TeamEntity>,
    @InjectRepository(TeamMembersEntity)
    private readonly teamMembersRepository: Repository<TeamMembersEntity>,
    @InjectRepository(TeamJoinRequestsEntity)
    private readonly teamJoinRequestRepository: Repository<TeamJoinRequestsEntity>,
    @InjectRepository(TeamInvitesRequestsEntity)
    private readonly teamInvitesRequestsRepository: Repository<TeamInvitesRequestsEntity>,
    private readonly apiKeyRepository: ApikeyRepository,
    private readonly userRepository: UserRepository,
  ) {}

  private async refreshLogo(teams: TeamEntity[]) {
    const s3Helpers = new S3Helpers();
    const promises = teams.filter(Boolean).map(async (team) => {
      if (team.iconUrl) {
        try {
          const { refreshed, refreshedUrl } = await s3Helpers.refreshSignedUrl(team.iconUrl);
          if (refreshed) {
            team.iconUrl = refreshedUrl;
            await this.teamRepository.save(team);
          }
        } catch (e) {}
      }
    });
    await Promise.all(promises);
  }

  public async getTeamById(id: string) {
    const team = await this.teamRepository.findOne({
      where: {
        id,
      },
    });
    await this.refreshLogo([team]);
    return team;
  }

  public async getTeamsByIds(ids: string[]) {
    const teams = await this.teamRepository.find({
      where: {
        id: In(ids),
        isDeleted: false,
      },
    });
    await this.refreshLogo(teams);
    return teams;
  }

  public async getTeamsByIdsAsMap(ids: string[]) {
    let teamHash: Record<string, TeamEntity> = {};
    if (ids?.length) {
      const teams = await this.getTeamsByIds(ids);
      teamHash = getMap(teams, (u) => u.id);
    }
    return teamHash;
  }

  async getUserTeams(userId: string): Promise<TeamEntity[]> {
    const relationships = await this.teamMembersRepository.find({
      where: {
        userId,
        isDeleted: false,
      },
    });
    const teamIds = Array.from(new Set(relationships.map((r) => r.teamId)));
    if (!teamIds.length) {
      return [];
    }
    const teams = await this.teamRepository.find({
      where: {
        id: In(teamIds),
        isDeleted: false,
      },
    });
    await this.refreshLogo(teams);
    return teams;
  }

  public async checkNameConflict(userId: string, name: string) {
    const team = await this.teamRepository.findOne({
      where: {
        ownerUserId: userId,
        isDeleted: false,
        name: name,
      },
    });
    return !!team;
  }

  async createTeam(userId: string, teamName: string, description?: string, iconUrl?: string, isBuiltIn = false, workflowTaskNamePrefix?: string) {
    if (await this.checkNameConflict(userId, teamName)) {
      throw new Error('同名团队已经存在，请更换名称');
    }
    const now = Date.now();
    const newTeam: TeamEntity = {
      id: generateDbId(),
      name: teamName,
      description,
      iconUrl,
      isBuiltIn,
      createdTimestamp: now,
      updatedTimestamp: now,
      ownerUserId: userId,
      isDeleted: false,
      workflowTaskNamePrefix,
    };
    const teamId = newTeam.id as string;
    const newReplationships: TeamMembersEntity = {
      id: generateDbId(),
      userId,
      teamId,
      createdTimestamp: now,
      updatedTimestamp: now,
      isDeleted: false,
    };
    await this.teamMembersRepository.save(newReplationships);
    await this.teamRepository.save(newTeam);
    await this.apiKeyRepository.initApiKeyIfNotExists(teamId, userId);

    return newTeam;
  }

  public async deleteTeam(teamId: string) {
    const res = await this.teamRepository.update(
      {
        id: teamId,
      },
      {
        isDeleted: true,
      },
    );
    return !!res.affected;
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
    if (!updates || !Object.keys(updates).length) {
      return;
    }
    const { name, description, iconUrl, customTheme } = updates || {};
    const team = await this.teamRepository.findOne({
      where: {
        id: teamId,
        isDeleted: false,
      },
    });
    if (!team) {
      throw new Error('团队不存在');
    }
    if (name) {
      const conflict = await this.checkNameConflict(team.ownerUserId, name);
      if (conflict) {
        throw new Error('同名团队已经存在，请更换名称');
      }
    }
    const now = Date.now();
    await this.teamRepository.update(
      {
        id: teamId,
      },
      _.pickBy(
        {
          name,
          description,
          iconUrl,
          customTheme,
          updatedTimestamp: now,
        },
        (v) => !_.isNil(v),
      ),
    );
  }

  public async isUserInTeam(userId: string, teamId: string) {
    const entity = await this.teamMembersRepository.findOne({
      where: {
        userId,
        teamId,
        isDeleted: false,
      },
    });
    return !!entity;
  }

  public async getTeamMembers(teamId: string) {
    const relationships = await this.teamMembersRepository.find({
      where: {
        teamId,
        isDeleted: false,
      },
    });
    const userIds = relationships.map((x) => x.userId);
    if (!userIds.length) {
      return [];
    }
    return await this.userRepository.findByIds(userIds);
  }

  public async removeTeamMember(teamId: string, userId: string) {
    const res = await this.teamMembersRepository.update(
      {
        teamId,
        userId,
      },
      {
        isDeleted: true,
      },
    );
    return !!res.affected;
  }

  public async makeJoinTeamRequest(teamId: string, userId: string) {
    const team = await this.getTeamById(teamId);
    if (!team) {
      throw new Error('团队不存在');
    }

    const isAccepted = await this.isUserInTeam(userId, teamId);
    if (isAccepted) {
      throw new Error('您已加入该团队，无需重复加入：'.concat(teamId));
    }

    if (!team.enableJoinRequest) {
      throw new Error('团队未开放申请加入');
    }

    const hasRequested = await this.teamJoinRequestRepository.exists({
      where: {
        teamId,
        userId,
        status: TeamJoinRequestStatus.PENDING,
      },
    });
    if (hasRequested) {
      throw new Error('您已申请加入该团队，请耐心等待审批');
    }

    const now = Date.now();
    await this.teamJoinRequestRepository.save({
      id: generateDbId(),
      createdTimestamp: now,
      updatedTimestamp: now,
      teamId: teamId,
      userId: userId,
      status: TeamJoinRequestStatus.PENDING,
    });
  }

  public async listJoinRequests(teamId: string) {
    const records = await this.teamJoinRequestRepository.find({
      where: {
        teamId,
        isDeleted: false,
      },
    });

    const userIds = uniq(records.map((x) => x.userId));
    const users = await this.userRepository.findByIds(userIds);

    const result: Array<TeamJoinRequestsEntity & { user: UserEntity }> = records.map((record) => ({
      ...record,
      user: users.find((user) => user.id === record.userId),
    }));
    return result;
  }

  public async createTeamInviteId(teamId: string, inviterUserId: string, outdateType: number, targetUserId?: string) {
    const outdateTimestamp = outdateType === TeamInviteLinkOutdateType.SEVEN_DAYS ? dayjs().add(7, 'd').valueOf() : 0;
    const inviteId = generateDbId();
    await this.teamInvitesRequestsRepository.save({
      id: inviteId,
      teamId,
      inviterUserId,
      targetUserId,
      outdateType,
      outdateTimestamp,
      createdTimestamp: Date.now(),
      updatedTimestamp: Date.now(),
      type: Number(targetUserId ? TeamInviteType.INDIVIDUAL : TeamInviteType.PUBLIC),
      status: Number(TeamInviteStatus.EFFECTIVE),
      acceptedUserIds: [],
    });
    return inviteId;
  }

  public async getTeamInvites(teamId: string) {
    const invites = await this.teamInvitesRequestsRepository.find({
      where: {
        teamId,
      },
    });
    const userIds = uniq(invites.map((x) => x.targetUserId));
    const users = await this.userRepository.findByIds(userIds);
    return invites.map((invite) => ({
      ...invite,
      user: users.find((user) => user.id === invite.targetUserId),
    }));
  }

  public async updateTeamInviteRemark(inviteId: string, remark: string) {
    const res = await this.teamInvitesRequestsRepository.update(
      {
        id: inviteId,
      },
      {
        remark,
      },
    );
    return !!res.affected;
  }

  public async toggleForeverTeamInviteLinkStatus(inviteId: string) {
    const invite = await this.teamInvitesRequestsRepository.findOne({
      where: {
        id: inviteId,
      },
    });
    if (!invite) {
      throw new Error('邀请链接不存在');
    }
    const res = await this.teamInvitesRequestsRepository.update(
      {
        id: inviteId,
      },
      {
        status: Number(invite.status === TeamInviteStatus.DISABLED ? TeamInviteStatus.EFFECTIVE : TeamInviteStatus.DISABLED),
      },
    );

    return !!res.affected;
  }

  public async deleteTeamInvite(inviteId: string) {
    const res = await this.teamInvitesRequestsRepository.delete({
      id: inviteId,
    });
    return !!res.affected;
  }

  public async getTeamInviteById(inviteId: string) {
    const invite = await this.teamInvitesRequestsRepository.findOne({
      where: {
        id: inviteId,
      },
    });
    if (!invite) {
      throw new Error('邀请链接不存在');
    }

    const isForeverInvite = invite?.outdateTimestamp === 0;
    const isIndicateInvite = invite?.outdateTimestamp > Date.now();
    if (!isForeverInvite && !isIndicateInvite) {
      throw new Error('邀请已经过期或无效');
    }

    return invite;
  }

  public async acceptTeamInvite(userId: string, inviteId: string) {
    const invite = await this.getTeamInviteById(inviteId);
    if (invite.status === TeamInviteStatus.DISABLED) {
      throw new Error('邀请链接已被禁用');
    }

    if (invite.type === TeamInviteType.INDIVIDUAL && invite.targetUserId !== userId) {
      throw new Error('邀请链接不适用于当前用户');
    }

    const team = await this.getTeamById(invite.teamId);
    if (!team) {
      throw new Error('团队不存在');
    }

    const isAccepted = await this.isUserInTeam(userId, team.id);
    if (isAccepted) {
      throw new Error('您已加入该团队，无需重复加入：'.concat(team.id));
    }

    const now = Date.now();
    await this.teamMembersRepository.save({
      id: generateDbId(),
      userId,
      teamId: team.id,
      createdTimestamp: now,
      updatedTimestamp: now,
      isDeleted: false,
    });

    invite.acceptedUserIds.push(userId);
    await this.teamInvitesRequestsRepository.update(
      {
        id: inviteId,
      },
      {
        acceptedUserIds: invite.acceptedUserIds,
      },
    );
  }
}
