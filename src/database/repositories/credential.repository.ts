import { CredentialDefinition } from '@/common/typings/tools';
import { generateDbId } from '@/common/utils';
import { ToolsCredentialTypeEntity } from '@/database/entities/tools/tools-credential-type.entity';
import { ToolsCredentialEntity } from '@/database/entities/tools/tools-credential.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, FindManyOptions, In, Repository } from 'typeorm';

@Injectable()
export class CredentialsRepository {
  constructor(
    @InjectRepository(ToolsCredentialTypeEntity)
    private readonly toolsCredentialTypeRepository: Repository<ToolsCredentialTypeEntity>,
    @InjectRepository(ToolsCredentialEntity)
    private readonly toolsCredentialRepository: Repository<ToolsCredentialEntity>,
  ) {}

  public async createOrUpdateCredentialTypes(namespace: string, latestCredentials: CredentialDefinition[]) {
    latestCredentials = latestCredentials.map((x) => {
      x.name = `${namespace}__${x.name}`;
      return x;
    });
    const latestCredentialNames = latestCredentials.map((x) => x.name);
    const originalCredentials = await this.toolsCredentialTypeRepository.find({
      where: {
        namespace,
        isDeleted: false,
      },
    });
    const originalCredentialNames = originalCredentials.map((x) => x.name);
    const credentialsToDelete = originalCredentials.filter((x) => !latestCredentialNames.includes(x.name));
    const credentialsToCreate = latestCredentials.filter((x) => !originalCredentialNames.includes(x.name));
    const credentialsToUpdate = originalCredentials.filter((x) => latestCredentialNames.includes(x.name));

    if (credentialsToCreate.length) {
      const entitiesToCreate: ToolsCredentialTypeEntity[] = credentialsToCreate.map(
        (x): ToolsCredentialTypeEntity => ({
          id: generateDbId(),
          isDeleted: false,
          createdTimestamp: +new Date(),
          updatedTimestamp: +new Date(),
          type: x.type,
          namespace: namespace,
          name: x.name,
          displayName: x.displayName,
          description: x.description,
          iconUrl: x.iconUrl,
          properties: x.properties,
        }),
      );
      await this.toolsCredentialTypeRepository.save(entitiesToCreate);
    }

    if (credentialsToDelete.length) {
      await this.toolsCredentialTypeRepository.update(
        {
          namespace,
          name: In(credentialsToDelete.map((x) => x.name)),
        },
        {
          isDeleted: true,
        },
      );
    }

    if (credentialsToUpdate.length) {
      const entitiesToUpdate = credentialsToUpdate.map((x): ToolsCredentialTypeEntity => {
        const latestDef = latestCredentials.find((t) => x.name === t.name);
        return {
          ...x,
          id: x.id,
          updatedTimestamp: +new Date(),
          displayName: latestDef.displayName,
          description: latestDef.description,
          iconUrl: latestDef.iconUrl,
          properties: latestDef.properties,
          type: latestDef.type,
        };
      });
      await this.toolsCredentialTypeRepository.save(entitiesToUpdate);
    }
  }

  public async getCredentialTypes() {
    return await this.toolsCredentialTypeRepository.find({
      where: {
        isDeleted: false,
      },
    });
  }

  public async getCredentialType(name: string) {
    return this.toolsCredentialTypeRepository.findOne({
      where: {
        name,
      },
    });
  }

  public async listCredentials(teamId: string, credentialType?: string) {
    const condition: FindManyOptions<ToolsCredentialEntity> = {
      where: {
        teamId,
        isDeleted: false,
        type: credentialType,
      },
    };
    const list = await this.toolsCredentialRepository.find(condition);
    return list;
  }

  public async getCredentialById(credentialId: string) {
    const entity = await this.toolsCredentialRepository.findOne({
      where: {
        id: credentialId,
      },
    });
    return entity;
  }

  public async isCredentialBelongToTeam(teamId: string, credentialId: string) {
    const entity = await this.toolsCredentialRepository.findOne({
      where: {
        teamId,
        id: credentialId,
      },
    });
    return !!entity;
  }

  public async deleteCredential(teamId: string, id: string) {
    const credential = await this.toolsCredentialRepository.findOne({
      where: {
        id,
        teamId,
        isDeleted: false,
      },
    });
    if (!credential) {
      throw new Error(`密钥 ${id} 不存在`);
    }
    await this.toolsCredentialRepository.update(
      {
        id,
        teamId,
      },
      {
        isDeleted: true,
      },
    );
    return {
      success: true,
    };
  }

  public async createCredentail(data: Partial<ToolsCredentialEntity>) {
    await this.toolsCredentialRepository.save(data);
  }

  public async updateCredential(teamId: string, id: string, displayName: string) {
    const credential = await this.toolsCredentialRepository.findOne({
      where: {
        id,
        teamId,
        isDeleted: false,
      },
    });
    if (!credential) {
      throw new Error(`密钥 ${id} 不存在`);
    }
    const updates: DeepPartial<ToolsCredentialEntity> = {};
    if (displayName) {
      updates.displayName = displayName;
    }
    await this.toolsCredentialRepository.update(
      {
        id: id,
        teamId,
        isDeleted: false,
      },
      updates,
    );
    return await this.getCredentialById(id);
  }
}
