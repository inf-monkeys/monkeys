import { Injectable } from '@nestjs/common';

import { CredentialsRepository } from '../../database/repositories/credential.repository';

@Injectable()
export class ToolsCredentialsService {
  constructor(private readonly credentialsRepository: CredentialsRepository) {}

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
    return await this.credentialsRepository.updateCredential(teamId, id, displayName, data);
  }

  public async deleteCredential(teamId: string, id: string) {
    return await this.credentialsRepository.deleteCredential(teamId, id);
  }

  public async createCredentail(teamId: string, creatorUserId: string, displayName: string, type: string, data: { [x: string]: any }) {
    return await this.credentialsRepository.createCredentail(teamId, creatorUserId, displayName, type, data);
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
