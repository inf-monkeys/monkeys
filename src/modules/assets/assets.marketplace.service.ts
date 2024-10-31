import { config } from '@/common/config';
import { ListDto } from '@/common/dto/list.dto';
import { ONEAPI_CHANNELS } from '@/common/oneapi/consts';
import { ComfyuiWorkflowAssetRepositroy } from '@/database/repositories/assets-comfyui-workflow.respository';
import { AssetsCommonRepository } from '@/database/repositories/assets-common.repository';
import { LlmChannelAssetRepositroy } from '@/database/repositories/assets-llm-channel.respository';
import { WorkflowAssetRepositroy } from '@/database/repositories/assets-workflow.respository';
import { AssetType } from '@inf-monkeys/monkeys';
import { Injectable } from '@nestjs/common';
import { AssetsMapperService } from './assets.common.service';
import { BUILT_IN_COMFYUI_WORKFLOW_MARKETPLACE_LIST, BUILT_IN_WORKFLOW_MARKETPLACE_LIST } from './assets.marketplace.data';

@Injectable()
export class AssetsMarketplaceService {
  constructor(
    private readonly workflowAssetRepository: WorkflowAssetRepositroy,
    private readonly comfyuiWorkflowAssetRepository: ComfyuiWorkflowAssetRepositroy,
    private readonly llmChannelAssetRepository: LlmChannelAssetRepositroy,
    private readonly assetsMapperService: AssetsMapperService,
    private readonly assetsCommonRepository: AssetsCommonRepository,
  ) {}

  public async initWorkflowMarketplace() {
    // Init workflow marketplace
    const data = BUILT_IN_WORKFLOW_MARKETPLACE_LIST;
    const allTags = data.map((x) => x.tags || []).flat();
    const marketplaceTagBatch = await this.assetsCommonRepository.createMarketplaceTagBatch('workflow', allTags);
    for (const item of data) {
      item.workflowId = item.id;
      await this.workflowAssetRepository.initBuiltInMarketPlace('workflow', item);
      if (item.tags) {
        const tagIds = item.tags.map((tagName) => marketplaceTagBatch.find((tag) => tag.name === tagName).id);
        await this.assetsCommonRepository.updateAssetMarketplaceTags('workflow', item.id, tagIds);
      }
    }
  }

  public async initComfyuiWorkflowMarketplace() {
    const data = BUILT_IN_COMFYUI_WORKFLOW_MARKETPLACE_LIST;
    for (const item of data) {
      await this.comfyuiWorkflowAssetRepository.initBuiltInMarketPlace('comfyui-workflow', item);
    }
  }

  public async initBuiltInLLMMarketplace() {
    for (const item of ONEAPI_CHANNELS) {
      await this.llmChannelAssetRepository.initBuiltInMarketPlace('llm-channel', item);
    }
  }

  public async initBuiltInMarketplace() {
    await this.initWorkflowMarketplace();
    if (config.oneapi.enabled) {
      await this.initBuiltInLLMMarketplace();
    }
    await this.initComfyuiWorkflowMarketplace();
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
