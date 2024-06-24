import { generateDbId } from '@/common/utils';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OneApiUsersEntity } from '../entities/oneapi/oneapi-user.entity';

@Injectable()
export class OneApiRepository {
  constructor(
    @InjectRepository(OneApiUsersEntity)
    private readonly oneApiUserEntity: Repository<OneApiUsersEntity>,
  ) {}

  public async getOneapiUserByTeamId(teamId: string) {
    return this.oneApiUserEntity.findOne({
      where: {
        teamId,
        isDeleted: false,
      },
    });
  }

  public async createOneapiUser(teamId: string, userId: number, userToken: string, apiKey: string, username: string, password: string) {
    const entity: Partial<OneApiUsersEntity> = {
      id: generateDbId(),
      isDeleted: false,
      createdTimestamp: +new Date(),
      updatedTimestamp: +new Date(),
      teamId,
      userId,
      apiKey,
      userToken,
      username,
      password,
    };
    await this.oneApiUserEntity.save(entity);
    return entity;
  }
}
