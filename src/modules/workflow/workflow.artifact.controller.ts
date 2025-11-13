import { CompatibleAuthGuard } from '@/common/guards/auth.guard';
import { WorkflowAuthGuard } from '@/common/guards/workflow-auth.guard';
import { SuccessListResponse, SuccessResponse } from '@/common/response';
import { IRequest } from '@/common/typings/request';
import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { WorkflowArtifactService } from './workflow.artifact.service';

@ApiTags('Workflows/Artifacts')
@Controller('/workflow/artifact')
export class WorkflowArtifactController {
  constructor(private readonly artifactService: WorkflowArtifactService) {}

  @ApiOperation({
    summary: '获取团队所有工作流产物',
    description: '分页获取当前团队下的所有工作流产物',
  })
  @UseGuards(CompatibleAuthGuard)
  @Get('all')
  async listTeamArtifacts(@Req() request: IRequest, @Query() query: { page?: string; limit?: string; orderBy?: 'DESC' | 'ASC' }) {
    const { teamId } = request;
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const orderBy = query.orderBy === 'ASC' ? 'ASC' : 'DESC';
    const result = await this.artifactService.getTeamArtifacts(teamId, { page, limit, orderBy });
    return new SuccessListResponse({
      page: result.page,
      limit: result.limit,
      total: result.total,
      data: result.data,
    });
  }

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
