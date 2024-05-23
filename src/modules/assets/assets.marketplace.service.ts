import { ListDto } from '@/common/dto/list.dto';
import { AssetType } from '@/common/typings/asset';
import { AssetsCommonRepository } from '@/database/repositories/assets-common.repository';
import { WorkflowAssetRepositroy } from '@/database/repositories/assets-workflow.respository';
import { WorkflowRepository } from '@/database/repositories/workflow.repository';
import { Injectable } from '@nestjs/common';
import { AssetsMapperService } from './assets.common.service';
import { BUILT_IN_WORKFLOW_MARKETPLACE_LIST } from './assets.marketplace.data';

@Injectable()
export class AssetsMarketplaceService {
  constructor(
    private readonly workflowAssetRepository: WorkflowAssetRepositroy,
    private readonly assetsMapperService: AssetsMapperService,
    private readonly assetsCommonRepository: AssetsCommonRepository,
    private readonly worfklowRepository: WorkflowRepository,
  ) {}

  public async initWorfklowMarketplace() {
    // Init workflow marketplace
    const data = BUILT_IN_WORKFLOW_MARKETPLACE_LIST;
    const allTags = data.map((x) => x.tags || []).flat();
    for (const item of data) {
      item.workflowId = item.id;
      await this.workflowAssetRepository.initBuiltInMarketPlace('knowledge-base', item);
    }
    await this.assetsCommonRepository.createMarketplaceTagBatch('workflow', allTags);
  }

  public async initBuiltInMarketplace() {
    await this.initWorfklowMarketplace();
  }

  public async listMarketplaceAssets(assetType: AssetType, dto: ListDto) {
    const repo = this.assetsMapperService.getRepositoryByAssetType(assetType);
    return await repo.listPublishedAssets(assetType, dto, {
      withTags: true,
      withTeam: true,
      withUser: true,
    });
  }

  public async getMarketplaceTags(assetType: AssetType) {
    return await this.assetsCommonRepository.listMarketplaceTags(assetType);
  }
}
