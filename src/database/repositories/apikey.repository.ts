import { generateDbId } from '@/common/utils';
import { generateRandomApiKey } from '@/common/utils/apikey';
import { ApiKeyEntity, ApiKeyStatus } from '@/database/entities/apikey/apikey';
import { CreateApiKeyDto } from '@/modules/auth/apikey/dto/create-apikey.dto';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class ApikeyRepository {
  constructor(
    @InjectRepository(ApiKeyEntity)
    public readonly apiKeyRepo: Repository<ApiKeyEntity>,
  ) {}

  public async validateApiKey(apiKey: string): Promise<{ valid: boolean; teamId?: string; userId?: string }> {
    const entity = await this.apiKeyRepo.findOne({
      where: {
        apiKey,
        isDeleted: false,
      },
    });
    if (!entity) {
      return { valid: false };
    }
    return {
      valid: entity.status === ApiKeyStatus.Valid,
      teamId: entity.teamId,
      userId: entity.creatorUserId,
    };
  }

  public async createApiKey(userId: string, teamId: string, body: CreateApiKeyDto) {
    const apiKey = generateRandomApiKey();
    const { desc } = body;
    const record: ApiKeyEntity = {
      id: generateDbId(),
      creatorUserId: userId,
      teamId,
      apiKey,
      status: ApiKeyStatus.Valid,
      createdTimestamp: Date.now(),
      updatedTimestamp: Date.now(),
      desc,
      isDeleted: false,
    };
    await this.apiKeyRepo.save(record);
    return record;
  }

  public async listApiKeys(userId: string, teamId: string) {
    const data = await this.apiKeyRepo.find({
      where: {
        creatorUserId: userId,
        teamId,
        isDeleted: false,
      },
      order: {
        id: -1,
      },
    });
    return data.filter((d) => ['auto generated by workflowId', '系统自动', '画板 授权'].every((s) => !d?.desc?.includes(s)));
  }

  public async revokeApiKey(userId: string, teamId: string, keyId: string) {
    await this.apiKeyRepo.update(
      {
        id: keyId,
        creatorUserId: userId,
        teamId,
        isDeleted: false,
      },
      {
        status: ApiKeyStatus.Revoked,
        updatedTimestamp: Date.now(),
      },
    );
    return true;
  }

  public async initApiKeyIfNotExists(teamId: string, userId: string) {
    const count = await this.apiKeyRepo.count({
      where: {
        teamId,
        creatorUserId: userId,
        isDeleted: false,
      },
    });
    if (count === 0) {
      await this.createApiKey(userId, teamId, {
        desc: 'Creaetd by system',
      });
    }
  }
}
