import { generateDbId } from '@/common/utils';
import { Injectable } from '@nestjs/common';
import { WorkflowAssetRepositroy } from './assets-workflow.respository';

@Injectable()
export class AssetsMarketPlaceRepository {
  constructor(private readonly workflowAssetsRepository: WorkflowAssetRepositroy) {}

  public async forkFromMarketPlaceWhenTeamCreate(teamId: string, creatorUserId: string) {
    await this.workflowAssetsRepository.forkFromMarketPlaceWhenTeamCreate(teamId, creatorUserId, () => {
      return {
        workflowId: generateDbId(),
      };
    });
  }
}
