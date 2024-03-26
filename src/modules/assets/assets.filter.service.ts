import { AssetType } from '@/common/typings/asset';
import { AssetsCommonRepository } from '@/database/repositories/assets-common.repository';
import { Injectable } from '@nestjs/common';
import { CreateAssetFilterDto } from './req/create-asset-filter.dto';
import { UpdateAssetFilterDto } from './req/update-asset-filter.dto';

@Injectable()
export class AssetsFilterService {
  constructor(private readonly assetsCommonRepository: AssetsCommonRepository) {}

  public async listFilters(teamId: string, assetType: AssetType) {
    return await this.assetsCommonRepository.listFilters(teamId, assetType);
  }

  public async createAssetFilter(teamId: string, userId: string, body: CreateAssetFilterDto) {
    return await this.assetsCommonRepository.createAssetFilter(teamId, userId, body);
  }

  public async updateAssetFilter(teamId: string, filterId: string, updates: UpdateAssetFilterDto) {
    return await this.assetsCommonRepository.updateAssetFilter(teamId, filterId, updates);
  }

  public async deleteAssetFilter(teamId: string, filterId: string) {
    return await this.assetsCommonRepository.deleteAssetFilter(teamId, filterId);
  }
}
