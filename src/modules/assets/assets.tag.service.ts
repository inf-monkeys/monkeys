import { AssetType } from '@/common/typings/asset';
import { AssetsCommonRepository } from '@/database/repositories/assets-common.repository';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AssetsTagService {
  constructor(private readonly assetsCommonRepository: AssetsCommonRepository) {}

  public async listTags(teamId: string) {
    return await this.assetsCommonRepository.listTags(teamId);
  }

  public async createTag(teamId: string, name: string, color: string) {
    return await this.assetsCommonRepository.createTag(teamId, name, color);
  }

  public async updateTag(teamId: string, tagId: string, name?: string, color?: string) {
    return await this.assetsCommonRepository.updateTag(teamId, tagId, {
      name,
      color,
    });
  }

  public async deleteTag(teamId: string, tagId: string) {
    return await this.assetsCommonRepository.deleteTag(teamId, tagId);
  }

  public async addTagsToAsset(teamId: string, assetType: AssetType, assetId: string, tagIds: string[]) {
    return await this.assetsCommonRepository.addTagsToAsset(teamId, assetType, assetId, tagIds);
  }

  public async removeAssetTags(teamId: string, assetType: AssetType, assetId: string, tagIds: string[]) {
    return await this.assetsCommonRepository.removeAssetTags(teamId, assetType, assetId, tagIds);
  }
}
