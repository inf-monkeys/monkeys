import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SdModelEntity } from '../entities/assets/model/sd-model/sd-model';
import { AbstractAssetRepository } from './assets-abstract.repository';
import { TeamRepository } from './team.repository';
import { UserRepository } from './user.repository';

@Injectable()
export class SdModelAssetRepositroy extends AbstractAssetRepository<SdModelEntity> {
  constructor(
    @InjectRepository(SdModelEntity)
    public readonly assetRepository: Repository<SdModelEntity>,
    public readonly userRepository: UserRepository,
    public readonly teamRepository: TeamRepository,
  ) {
    super(assetRepository, userRepository, teamRepository);
  }
}
