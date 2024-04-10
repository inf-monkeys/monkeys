import { CredentialDefinition } from '@/common/typings/tools';
import { generateDbId } from '@/common/utils';
import { ToolsCredentialTypeEntity } from '@/database/entities/tools/tools-credential-type.entity';
import { ToolsCredentialEntity } from '@/database/entities/tools/tools-credential.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AES, enc } from 'crypto-js';
import { DeepPartial, FindManyOptions, In, Repository } from 'typeorm';
import { SystemConfigurationRepository } from './system-configuration.repository';

@Injectable()
export class CredentialsRepository {
  constructor(
    @InjectRepository(ToolsCredentialTypeEntity)
    private readonly toolsCredentialTypeRepository: Repository<ToolsCredentialTypeEntity>,
    @InjectRepository(ToolsCredentialEntity)
    private readonly toolsCredentialRepository: Repository<ToolsCredentialEntity>,
    private readonly systemConfigurationRepository: SystemConfigurationRepository,
  ) {}

  public async getEncryptKey() {
    return;
  }

  public async encrypt(data: { [x: string]: any }) {
    return AES.encrypt(JSON.stringify(data), await this.systemConfigurationRepository.getAesKey()).toString();
  }

  public async decrypt(data: string): Promise<{ [x: string]: any }> {
    const decryptedData = AES.decrypt(data, await this.systemConfigurationRepository.getAesKey());
    try {
      return JSON.parse(decryptedData.toString(enc.Utf8));
    } catch (e) {
      throw new Error('Credentials could not be decrypted. The likely reason is that a different "encryptionKey" was used to encrypt the data.');
    }
  }

  public async createOrUpdateCredentialTypes(namespace: string, latestCredentials: CredentialDefinition[]) {
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
    for (const item of list) {
      item.data = await this.decrypt(item.data as string);
    }
    return list;
  }

  public async getCredentialById(credentialId: string) {
    const entity = await this.toolsCredentialRepository.findOne({
      where: {
        id: credentialId,
      },
    });
    if (entity) {
      entity.data = await this.decrypt(entity.data as string);
    }

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

  public async createCredentail(teamId: string, creatorUserId: string, displayName: string, type: string, data: { [x: string]: any }) {
    const encryptedData = await this.encrypt(data);
    const id = generateDbId();
    await this.toolsCredentialRepository.save({
      teamId,
      creatorUserId,
      displayName,
      data: encryptedData,
      id: id,
      type,
      isDeleted: false,
    });
    return await this.getCredentialById(id);
  }

  public async updateCredential(teamId: string, id: string, displayName: string, data: { [x: string]: any }) {
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
    if (data) {
      updates.data = await this.encrypt(data);
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
