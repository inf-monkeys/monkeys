import { CompatibleAuthGuard } from '@/common/guards/auth.guard';
import { WorkflowAuthGuard } from '@/common/guards/workflow-auth.guard';
import { SuccessResponse } from '@/common/response';
import { IRequest } from '@/common/typings/request';
import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { WorkflowArtifactService } from './workflow.artifact.service';

@ApiTags('Workflows/Artifacts')
@Controller('/workflow/artifact')
export class WorkflowArtifactController {
  constructor(private readonly artifactService: WorkflowArtifactService) {}

  @ApiOperation({
    summary: '获取工作流某次执行结果的产物',
    description: '获取工作流某次执行结果的产物',
  })
  @UseGuards(WorkflowAuthGuard, CompatibleAuthGuard)
  @Get(':instanceId')
  async listWorkflowArtifacts(@Param('instanceId') instanceId: string, @Req() request: IRequest) {
    const { teamId } = request;
    const data = await this.artifactService.getWorkflowArtifacts(instanceId, teamId);
    return new SuccessResponse({ data });
  }

  @ApiOperation({
    summary: '根据产物 url 获取工作流实例',
    description: '根据产物 url 获取工作流实例',
  })
  @UseGuards(WorkflowAuthGuard, CompatibleAuthGuard)
  @Post('getInstanceByUrl')
  async getWorkflowInstanceByArtfactUrl(@Body() body: { url: string }, @Req() request: IRequest) {
    const { teamId } = request;
    const data = await this.artifactService.getWorkflowInstanceByArtfactUrl(body.url, teamId);
    return new SuccessResponse({ data });
  }
}
