import { WorkflowAssetRepositroy } from '@/database/repositories/assets-workflow.respository';
import { Injectable } from '@nestjs/common';
import { BUILT_IN_WORKFLOW_MARKETPLACE_LIST } from './assets.marketplace.data';

@Injectable()
export class AssetsMarketplaceService {
  constructor(private readonly workflowAssetRepository: WorkflowAssetRepositroy) {}

  public async initBuiltInMarketplace() {
    // Init workflow marketplace
    const data = BUILT_IN_WORKFLOW_MARKETPLACE_LIST;
    for (const item of data) {
      item.workflowId = item.id;
      await this.workflowAssetRepository.initBuiltInMarketPlace('knowledge-base', item);
    }
  }
}
