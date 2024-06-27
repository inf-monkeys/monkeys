import { config } from '@/common/config';
import { ListDto } from '@/common/dto/list.dto';
import { ONEAPI_CHANNELS } from '@/common/oneapi/consts';
import { AssetsCommonRepository } from '@/database/repositories/assets-common.repository';
import { LlmChannelAssetRepositroy } from '@/database/repositories/assets-llm-channel.respository';
import { WorkflowAssetRepositroy } from '@/database/repositories/assets-workflow.respository';
import { AssetType } from '@inf-monkeys/monkeys';
import { Injectable } from '@nestjs/common';
import { AssetsMapperService } from './assets.common.service';
import { BUILT_IN_WORKFLOW_MARKETPLACE_LIST } from './assets.marketplace.data';

@Injectable()
export class AssetsMarketplaceService {
  constructor(
    private readonly workflowAssetRepository: WorkflowAssetRepositroy,
    private readonly llmChannelAssetRepository: LlmChannelAssetRepositroy,
    private readonly assetsMapperService: AssetsMapperService,
    private readonly assetsCommonRepository: AssetsCommonRepository,
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

  public async initBuiltInLLMMarketplace() {
    const data = ONEAPI_CHANNELS;
    for (const item of data) {
      await this.llmChannelAssetRepository.initBuiltInMarketPlace('llm-channel', item);
    }
  }

  public async initBuiltInMarketplace() {
    await this.initWorfklowMarketplace();
    if (config.oneapi.enabled) {
      await this.initBuiltInLLMMarketplace();
    }
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
