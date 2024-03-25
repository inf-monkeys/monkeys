import { ToolsCredentialTypeEntity } from '@/database/entities/tools/tools-credential-type.entity';
import { ToolsCredentialEntity } from '@/database/entities/tools/tools-credential.entity';
import { CredentialDefinition } from '@/modules/tools/interfaces';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AES, enc } from 'crypto-js';
import { ObjectId } from 'mongodb';
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
          id: new ObjectId(),
          isDeleted: false,
          createdTimestamp: +new Date(),
          updatedTimestamp: +new Date(),
          type: x.type,
          namespace: namespace,
          name: x.name,
          displayName: x.displayName,
          description: x.description,
          icon: x.icon,
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
          icon: latestDef.icon,
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
    let list = await this.toolsCredentialRepository.find(condition);
    list = list.map((x) => {
      x.data = this.decrypt(x.data as string);
      return x;
    });
    return list;
  }

  public async getCredentialById(credentialId: string) {
    const entity = await this.toolsCredentialRepository.findOne({
      where: {
        id: new ObjectId(credentialId),
      },
    });
    if (entity) {
      entity.data = this.decrypt(entity.data as string);
    }

    return entity;
  }

  public async isCredentialBelongToTeam(teamId: string, credentialId: string) {
    const entity = await this.toolsCredentialRepository.findOne({
      where: {
        teamId,
        id: new ObjectId(credentialId),
      },
    });
    return !!entity;
  }

  public async deleteCredential(teamId: string, id: string) {
    const credential = await this.toolsCredentialRepository.findOne({
      where: {
        id: new ObjectId(id),
        teamId,
        isDeleted: false,
      },
    });
    if (!credential) {
      throw new Error(`密钥 ${id} 不存在`);
    }
    await this.toolsCredentialRepository.update(
      {
        id: new ObjectId(id),
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
    const encryptedData = this.encrypt(data);
    const id = new ObjectId();
    await this.toolsCredentialRepository.save({
      teamId,
      creatorUserId,
      displayName,
      data: encryptedData,
      id: id,
      type,
      isDeleted: false,
    });
    return await this.getCredentialById(id.toHexString());
  }

  public async updateCredential(teamId: string, id: string, displayName: string, data: { [x: string]: any }) {
    const credential = await this.toolsCredentialRepository.findOne({
      where: {
        id: new ObjectId(id),
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
      updates.data = this.encrypt(data);
    }
    await this.toolsCredentialRepository.update(
      {
        id: new ObjectId(id),
        teamId,
        isDeleted: false,
      },
      updates,
    );
    return await this.getCredentialById(id);
  }
}
