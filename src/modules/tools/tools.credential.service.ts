import { Injectable } from '@nestjs/common';

import { CredentialEndpointType } from '@/common/typings/tools';
import { generateDbId } from '@/common/utils';
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

  private async getCredentialActionEndpint(toolNamespace: string, type: CredentialEndpointType) {
    const toolServer = await this.toolsRepository.getServerByNamespace(toolNamespace);
    if (!toolServer) {
      throw new Error(`INTERNAL SERVER ERROR: tool server ${toolNamespace} not exists`);
    }
    if (!toolServer.credentialEndpoints) {
      throw new Error(`INTERNAL SERVER ERROR: tool server ${toolNamespace} credentialEndpoints is missing`);
    }
    const credentialEndpoint = toolServer.credentialEndpoints.find((x) => x.type === type);
    if (!credentialEndpoint) {
      throw new Error(`INTERNAL SERVER ERROR: tool server ${toolNamespace} credentialEndpoint of ${type} is missing`);
    }
    return credentialEndpoint;
  }

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
    // Save credential in monkeys (**NOT INCLUDE DATA**)
    return await this.credentialsRepository.updateCredential(teamId, id, displayName);
  }

  public async deleteCredential(teamId: string, id: string) {
    return await this.credentialsRepository.deleteCredential(teamId, id);
  }

  public async createCredentail(teamId: string, creatorUserId: string, displayName: string, type: string, data: { [x: string]: any }) {
    // Save credential in monkeys (**NOT INCLUDE DATA**)
    const toolNamespace = type.split('__')[0];
    const { method, url } = await this.getCredentialActionEndpint(toolNamespace, CredentialEndpointType.create);
    const credentialId = generateDbId();

    await this.toolsForwardService.request(toolNamespace, {
      method,
      url,
      data: {
        context: {
          credentialId,
          creatorUserId,
          teamId,
        },
        type: type.split('__')[1],
        displayName,
        data,
      },
    });
    const entity: Partial<ToolsCredentialEntity> = {
      teamId,
      creatorUserId,
      displayName,
      id: credentialId,
      type,
      isDeleted: false,
    };
    return await this.credentialsRepository.createCredentail(entity);
  }

  public async listCredentials(teamId: string, credentialType?: string) {
    return await this.credentialsRepository.listCredentials(teamId, credentialType);
  }

  public async getCredentialById(credentialId: string) {
    const entity = await this.credentialsRepository.getCredentialById(credentialId);
    return entity;
  }

  public async isCredentialBelongToTeam(teamId: string, credentialId: string) {
    return await this.credentialsRepository.isCredentialBelongToTeam(teamId, credentialId);
  }
}
