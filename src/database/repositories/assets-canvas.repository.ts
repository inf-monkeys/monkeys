import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CanvasApplicationEntity } from '../entities/assets/canvas/canvas';
import { AbstractAssetRepository } from './assets-abstract.repository';
import { TeamRepository } from './team.repository';
import { UserRepository } from './user.repository';

@Injectable()
export class CanvasAssetRepositroy extends AbstractAssetRepository<CanvasApplicationEntity> {
  constructor(
    @InjectRepository(CanvasApplicationEntity)
    public readonly assetRepository: Repository<CanvasApplicationEntity>,
    public readonly userRepository: UserRepository,
    public readonly teamRepository: TeamRepository,
  ) {
    super(assetRepository, userRepository, teamRepository);
  }
}
