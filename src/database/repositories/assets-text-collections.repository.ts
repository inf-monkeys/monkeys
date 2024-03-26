import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TextCollectionEntity } from '../entities/assets/collection/text-collection/text-collection';
import { AbstractAssetRepository } from './assets-abstract.repository';
import { TeamRepository } from './team.repository';
import { UserRepository } from './user.repository';

@Injectable()
export class TextCollectionAssetRepositroy extends AbstractAssetRepository<TextCollectionEntity> {
  constructor(
    @InjectRepository(TextCollectionEntity)
    public readonly assetRepository: Repository<TextCollectionEntity>,
    public readonly userRepository: UserRepository,
    public readonly teamRepository: TeamRepository,
  ) {
    super(assetRepository, userRepository, teamRepository);
  }
}
