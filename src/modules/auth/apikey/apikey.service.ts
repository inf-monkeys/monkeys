import { ApikeyRepository } from '@/repositories/apikey.repository';
import { Injectable } from '@nestjs/common';
import { CreateApiKeyDto } from './dto/create-apikey.dto';

@Injectable()
export class ApikeyService {
  constructor(private readonly apikeyRepository: ApikeyRepository) {}

  public async validateApiKey(apiKey: string): Promise<{ valid: boolean; teamId?: string; userId?: string }> {
    return await this.apikeyRepository.validateApiKey(apiKey);
  }

  public async createApiKey(userId: string, teamId: string, body: CreateApiKeyDto) {
    return await this.apikeyRepository.createApiKey(userId, teamId, body);
  }

  public async listApiKeys(userId: string, teamId: string) {
    return await this.apikeyRepository.listApiKeys(userId, teamId);
  }

  public async revokeApiKey(userId: string, teamId: string, keyId: string) {
    await this.apikeyRepository.revokeApiKey(userId, teamId, keyId);
  }
}
