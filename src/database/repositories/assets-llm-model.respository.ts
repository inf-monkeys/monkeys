import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LlmModelEntity } from '../entities/assets/model/llm-model/llm-model';
import { AbstractAssetRepository } from './assets-abstract.repository';
import { TeamRepository } from './team.repository';
import { UserRepository } from './user.repository';

@Injectable()
export class LlmModelAssetRepositroy extends AbstractAssetRepository<LlmModelEntity> {
  constructor(
    @InjectRepository(LlmModelEntity)
    public readonly assetRepository: Repository<LlmModelEntity>,
    public readonly userRepository: UserRepository,
    public readonly teamRepository: TeamRepository,
  ) {
    super(assetRepository, userRepository, teamRepository);
  }
}
