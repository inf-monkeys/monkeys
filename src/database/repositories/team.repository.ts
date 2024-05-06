import { generateDbId } from '@/common/utils';
import { getMap } from '@/common/utils/map';
import { TeamEntity } from '@/database/entities/identity/team';
import { TeamMembersEntity } from '@/database/entities/identity/user-team-relationship';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import _, { uniq } from 'lodash';
import { In, Repository } from 'typeorm';
import { TeamJoinRequestStatus, TeamJoinRequestsEntity } from '../entities/identity/team-join-request';
import { UserEntity } from '../entities/identity/user';
import { ApikeyRepository } from './apikey.repository';
import { UserRepository } from './user.repository';

@Injectable()
export class TeamRepository {
  constructor(
    @InjectRepository(TeamEntity)
    private readonly teamRepository: Repository<TeamEntity>,
    @InjectRepository(TeamMembersEntity)
    private readonly teamMembersRepository: Repository<TeamMembersEntity>,
    @InjectRepository(TeamJoinRequestsEntity)
    private readonly teamJoinRequestRepository: Repository<TeamJoinRequestsEntity>,
    private readonly apiKeyRepository: ApikeyRepository,
    private readonly userRepository: UserRepository,
  ) {}

  public async getTeamById(id: string) {
    return await this.teamRepository.findOne({
      where: {
        id,
      },
    });
  }

  public async getTeamsByIdsAsMap(ids: string[]) {
    let userHash: Record<string, TeamEntity> = {};
    if (ids?.length) {
      const users = await this.teamRepository.find({
        where: {
          id: In(ids),
        },
      });
      userHash = getMap(users, (u) => u.id);
    }
    return userHash;
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
    return await this.teamRepository.find({
      where: {
        id: In(teamIds),
        isDeleted: false,
      },
    });
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

  public async updateTeam(
    teamId: string,
    updates?: {
      name?: string;
      description?: string;
      iconUrl?: string;
    },
  ) {
    if (!updates || !Object.keys(updates).length) {
      return;
    }
    const { name, description, iconUrl } = updates || {};
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
}
