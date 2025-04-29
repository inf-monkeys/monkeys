import { CompatibleAuthGuard } from '@/common/guards/auth.guard';
import { SuccessResponse } from '@/common/response';
import { IRequest } from '@/common/typings/request';
import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateWorkflowObservabilityDto } from './dto/req/create-workflow-observability.dto';
import { WorkflowObservabilityService } from './workflow.observability.service';

@Controller('workflow')
@ApiTags('Workflows/Observability')
@UseGuards(CompatibleAuthGuard)
export class WorkflowObservabilityController {
  constructor(private readonly service: WorkflowObservabilityService) { }

  @Get('/:workflowId/observability')
  @ApiOperation({
    summary: '获取 workflow 可观测性列表',
    description: '获取 workflow 可观测性列表',
  })
  public async getWorkflowObservability(@Req() req: IRequest, @Param('workflowId') workflowId: string) {
    const { teamId } = req;
    const workflowObservability = await this.service.getWorkflowObservabilityDataList(teamId, workflowId);
    return new SuccessResponse({
      data: workflowObservability,
    });
  }

  @Post('/:workflowId/observability')
  @ApiOperation({
    summary: '创建 workflow可观测性',
    description: '创建 workflow 可观测性',
  })
  public async createWorkflowObservability(@Req() req: IRequest, @Param('workflowId') workflowId: string, @Body() body: CreateWorkflowObservabilityDto) {
    const { teamId } = req;
    const { platform, platformConfig, name } = body;

    const workflowObservability = await this.service.createWorkflowObservability(teamId, workflowId, platform, platformConfig, name);

    return new SuccessResponse({
      data: workflowObservability,
    });
  }
}
