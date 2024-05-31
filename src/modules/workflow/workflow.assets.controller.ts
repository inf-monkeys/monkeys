import { CompatibleAuthGuard } from '@/common/guards/auth.guard';
import { SuccessResponse } from '@/common/response';
import { IRequest } from '@/common/typings/request';
import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { WorkflowRelatedAssetResult } from './interfaces';
import { WorkflowAssetsService } from './workflow.assets.service';

@Controller('/workflow')
@ApiTags('Workflows/Assets')
@UseGuards(CompatibleAuthGuard)
export class WorkflowAssetsController {
  constructor(private readonly service: WorkflowAssetsService) {}

  @Get('/:workflowId/related-assets')
  @ApiOperation({
    summary: '检查模板中包含的数据资产',
    description: '检查模板中包含的数据资产',
  })
  public async getWorkflowRelatedAssets(@Req() req: IRequest, @Param('workflowId') workflowId: string, @Query('version') versionStr: string) {
    const { teamId } = req;
    let data: WorkflowRelatedAssetResult;
    if (versionStr) {
      const version = parseInt(versionStr);
      data = await this.service.getWorkflowRelatedAssets(teamId, workflowId, version);
      // const subWorkflows = await this.workflowCommonService.getSubWorkflowsInWorkflow(teamId, workflowId, version);
      // data.subWorkflows = subWorkflows;
    } else {
      data = await this.service.getWorkflowRelatedAssetsOfAllVersion(teamId, workflowId);
      // const maxVersion = await this.workflowRepository.getMaxVersion(teamId, workflowId);
      // const subWorkflows = await this.service.getSubWorkflowsInWorkflow(teamId, workflowId, maxVersion);
      // data.subWorkflows = subWorkflows;
    }

    return new SuccessResponse({
      data,
    });
  }
}
