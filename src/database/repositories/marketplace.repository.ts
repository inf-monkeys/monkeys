import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InstalledAppEntity } from '../entities/marketplace/installed-app.entity';
import { MarketplaceAppVersionEntity } from '../entities/marketplace/marketplace-app-version.entity';
import { MarketplaceAppEntity } from '../entities/marketplace/marketplace-app.entity';

@Injectable()
export class MarketplaceRepository {
  constructor(
    @InjectRepository(MarketplaceAppEntity)
    public readonly app: Repository<MarketplaceAppEntity>,
    @InjectRepository(MarketplaceAppVersionEntity)
    public readonly version: Repository<MarketplaceAppVersionEntity>,
    @InjectRepository(InstalledAppEntity)
    public readonly installedApp: Repository<InstalledAppEntity>,
  ) {}
}
