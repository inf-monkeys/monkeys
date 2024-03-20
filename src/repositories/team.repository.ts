import { TeamEntity } from '@/entities/identity/team';
import { UserTeamRelationshipEntity } from '@/entities/identity/user-team-relationship';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ObjectId } from 'mongodb';
import { In, Repository } from 'typeorm';

@Injectable()
export class TeamRepository {
  constructor(
    @InjectRepository(TeamEntity)
    private readonly teamRepository: Repository<TeamEntity>,
    @InjectRepository(UserTeamRelationshipEntity)
    private readonly userTeamRelationRepository: Repository<UserTeamRelationshipEntity>,
  ) {}

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

  async createTeam(userId: string, teamName: string, description?: string, logoUrl?: string, isBuiltIn = false, workflowTaskNamePrefix?: string, createMethod: 'self' | 'import' = 'self') {
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

    // TODO
    // this.assetCommonService.initAssets(teamId, userId);

    return teamId;
  }
}
