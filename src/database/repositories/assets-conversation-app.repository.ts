import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConversationAppEntity } from '../entities/conversation-app/conversation-app.entity';
import { AbstractAssetRepository } from './assets-abstract.repository';
import { AssetsCommonRepository } from './assets-common.repository';

@Injectable()
export class ConversationAppAssetRepositroy extends AbstractAssetRepository<ConversationAppEntity> {
  constructor(
    @InjectRepository(ConversationAppEntity)
    public readonly assetRepository: Repository<ConversationAppEntity>,
    public readonly assetCommonRepository: AssetsCommonRepository,
  ) {
    super(assetRepository, assetCommonRepository);
  }
}
