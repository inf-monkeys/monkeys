import { Injectable } from '@nestjs/common';

import { generateDbId } from '@/common/utils';
import { encryptWithPublicKey } from '@/common/utils/rsa';
import { ToolsCredentialEntity } from '@/database/entities/tools/tools-credential.entity';
import { ToolsRepository } from '@/database/repositories/tools.repository';
import { CredentialsRepository } from '../../database/repositories/credential.repository';
import { ToolsForwardService } from './tools.forward.service';

@Injectable()
export class ToolsCredentialsService {
  constructor(
    private readonly credentialsRepository: CredentialsRepository,
    private readonly toolsRepository: ToolsRepository,
    private readonly toolsForwardService: ToolsForwardService,
  ) {}

  public async getCredentialType(name: string) {
    return this.credentialsRepository.getCredentialType(name);
  }

  public async getCredentialTypeOrFail(name: string) {
    const credentialType = await this.getCredentialType(name);
    if (!credentialType) {
      throw new Error(`密钥 ${name} 不存在`);
    }
    return credentialType;
  }

  public async getCredentialTypes() {
    return await this.credentialsRepository.getCredentialTypes();
  }

  public async updateCredential(teamId: string, id: string, displayName: string, data: { [x: string]: any }) {
    const credential = await this.credentialsRepository.getCredentialById(teamId, id);
    if (!credential) {
      throw new Error(`Credential ${id} not found`);
    }
    const toolNamespace = credential.type.split(':')[0];
    const namespace = await this.toolsRepository.getServerByNamespace(toolNamespace);
    if (!namespace) {
      throw new Error(`Namespace ${toolNamespace} Not found`);
    }
    const rasPublicKey = namespace.rasPublicKey;
    if (!rasPublicKey) {
      throw new Error(`RSA public key for configured for namespace ${toolNamespace}`);
    }
    const encryptedData = encryptWithPublicKey(JSON.stringify(data), rasPublicKey);
    return await this.credentialsRepository.updateCredential(teamId, id, displayName, encryptedData);
  }

  public async deleteCredential(teamId: string, id: string) {
    return await this.credentialsRepository.deleteCredential(teamId, id);
  }

  public async createCredentail(teamId: string, creatorUserId: string, displayName: string, type: string, data: { [x: string]: any }) {
    // Save credential in monkeys (**NOT INCLUDE DATA**)
    const toolNamespace = type.split(':')[0];
    const namespace = await this.toolsRepository.getServerByNamespace(toolNamespace);
    if (!namespace) {
      throw new Error(`Namespace ${toolNamespace} Not found`);
    }
    const rasPublicKey = namespace.rasPublicKey;
    if (!rasPublicKey) {
      throw new Error(`RSA public key for configured for namespace ${toolNamespace}`);
    }
    const credentialId = generateDbId();

    const entity: Partial<ToolsCredentialEntity> = {
      teamId,
      creatorUserId,
      displayName,
      id: credentialId,
      type,
      isDeleted: false,
      encryptedData: encryptWithPublicKey(JSON.stringify(data), rasPublicKey),
    };
    return await this.credentialsRepository.createCredentail(entity);
  }

  public async listCredentials(teamId: string, credentialType?: string) {
    return await this.credentialsRepository.listCredentials(teamId, credentialType);
  }

  public async getCredentialById(teamId: string, credentialId: string) {
    const entity = await this.credentialsRepository.getCredentialById(teamId, credentialId);
    return entity;
  }

  public async isCredentialBelongToTeam(teamId: string, credentialId: string) {
    return await this.credentialsRepository.isCredentialBelongToTeam(teamId, credentialId);
  }
}
