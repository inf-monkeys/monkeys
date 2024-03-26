import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MediaFileEntity } from '../entities/assets/media/media-file';
import { AbstractAssetRepository } from './assets-abstract.repository';
import { TeamRepository } from './team.repository';
import { UserRepository } from './user.repository';

@Injectable()
export class MediaFileAssetRepositroy extends AbstractAssetRepository<MediaFileEntity> {
  constructor(
    @InjectRepository(MediaFileEntity)
    public readonly assetRepository: Repository<MediaFileEntity>,
    public readonly userRepository: UserRepository,
    public readonly teamRepository: TeamRepository,
  ) {
    super(assetRepository, userRepository, teamRepository);
  }
}
