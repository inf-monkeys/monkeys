import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TableCollectionEntity } from '../entities/assets/collection/table-collection/table-collection';
import { AbstractAssetRepository } from './assets-abstract.repository';
import { TeamRepository } from './team.repository';
import { UserRepository } from './user.repository';

@Injectable()
export class TableCollectionAssetRepositroy extends AbstractAssetRepository<TableCollectionEntity> {
  constructor(
    @InjectRepository(TableCollectionEntity)
    public readonly assetRepository: Repository<TableCollectionEntity>,
    public readonly userRepository: UserRepository,
    public readonly teamRepository: TeamRepository,
  ) {
    super(assetRepository, userRepository, teamRepository);
  }
}
