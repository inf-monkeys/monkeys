import { getMap } from '@/common/utils/map';
import { TeamEntity } from '@/database/entities/identity/team';
import { UserTeamRelationshipEntity } from '@/database/entities/identity/user-team-relationship';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ObjectId } from 'mongodb';
import { In, Repository } from 'typeorm';
import { ApikeyRepository } from './apikey.repository';

@Injectable()
export class TeamRepository {
  constructor(
    @InjectRepository(TeamEntity)
    private readonly teamRepository: Repository<TeamEntity>,
    @InjectRepository(UserTeamRelationshipEntity)
    private readonly userTeamRelationRepository: Repository<UserTeamRelationshipEntity>,
    private readonly apiKeyRepository: ApikeyRepository,
  ) {}

  public async getTeamById(id: string) {
    return await this.teamRepository.findOne({
      where: {
        id: new ObjectId(id),
      },
    });
  }

  public async getTeamsByIdsAsMap(ids: string[]) {
    let userHash: Record<string, TeamEntity> = {};
    if (ids?.length) {
      const users = await this.teamRepository.find({
        where: {
          id: In(ids.map((x) => new ObjectId(x))),
        },
      });
      userHash = getMap(users, (u) => u.id.toHexString());
    }
    return userHash;
  }

  async getUserTeams(userId: string): Promise<TeamEntity[]> {
    const relationships = await this.userTeamRelationRepository.find({
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
        id: In(teamIds.map((id) => new ObjectId(id))),
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

  async createTeam(userId: string, teamName: string, description?: string, logoUrl?: string, isBuiltIn = false, workflowTaskNamePrefix?: string) {
    if (await this.checkNameConflict(userId, teamName)) {
      throw new Error('同名团队已经存在，请更换名称');
    }
    const now = Date.now();
    const newTeam: TeamEntity = {
      id: new ObjectId(),
      name: teamName,
      description,
      iconUrl: logoUrl,
      isBuiltIn,
      createdTimestamp: now,
      updatedTimestamp: now,
      ownerUserId: userId,
      isDeleted: false,
      workflowTaskNamePrefix,
    };
    const teamId = newTeam.id.toHexString() as string;
    const newReplationships: UserTeamRelationshipEntity = {
      id: new ObjectId(),
      userId,
      teamId,
      createdTimestamp: now,
      updatedTimestamp: now,
      isDeleted: false,
    };
    await this.userTeamRelationRepository.save(newReplationships);
    await this.teamRepository.save(newTeam);
    await this.apiKeyRepository.initApiKeyIfNotExists(teamId, userId);

    // TODO
    // this.assetCommonService.initAssets(teamId, userId);

    return teamId;
  }

  public async isUserInTeam(userId: string, teamId: string) {
    const entity = await this.userTeamRelationRepository.findOne({
      where: {
        userId,
        teamId,
        isDeleted: false,
      },
    });
    return !!entity;
  }
}
