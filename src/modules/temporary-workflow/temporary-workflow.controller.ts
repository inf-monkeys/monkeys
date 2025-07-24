import { CompatibleAuthGuard } from '@/common/guards/auth.guard';
import { WorkflowAuthGuard } from '@/common/guards/workflow-auth.guard';
import { SuccessResponse } from '@/common/response';
import { IRequest } from '@/common/typings/request';
import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { TemporaryWorkflowService } from './temporary-workflow.service';

@Controller('/temporary-workflow')
export class TemporaryWorkflowController {
  constructor(private readonly temporaryWorkflowService: TemporaryWorkflowService) {}

  @Get('/:temporaryId')
  @ApiOperation({
    summary: '获取临时工作流信息（支持租户鉴权）',
    description: '根据临时ID获取工作流信息',
  })
  @UseGuards(WorkflowAuthGuard, CompatibleAuthGuard)
  async getTemporaryWorkflowInfo(@Param('temporaryId') temporaryId: string) {
    const result = await this.temporaryWorkflowService.getTemporaryWorkflowInfo(temporaryId);
    return new SuccessResponse({
      data: result,
    });
  }

  @Post('/:temporaryId/execute')
  @ApiOperation({
    summary: '执行临时工作流',
    description: '执行指定的临时工作流',
  })
  @UseGuards(WorkflowAuthGuard, CompatibleAuthGuard)
  async executeTemporaryWorkflow(@Req() req: IRequest, @Param('temporaryId') temporaryId: string, @Body() body: { inputData: Record<string, any> }) {
    const { teamId, userId } = req;
    const result = await this.temporaryWorkflowService.executeTemporaryWorkflow(temporaryId, body.inputData, teamId, userId);
    return new SuccessResponse({
      data: result,
    });
  }

  @Get('/:temporaryId/result')
  @ApiOperation({
    summary: '获取临时工作流执行结果',
    description: '获取临时工作流的执行结果',
  })
  @UseGuards(WorkflowAuthGuard, CompatibleAuthGuard)
  async getTemporaryWorkflowResult(@Param('temporaryId') temporaryId: string) {
    const result = await this.temporaryWorkflowService.getTemporaryWorkflowResult(temporaryId);
    return new SuccessResponse({
      data: result,
    });
  }

  @Post('/:temporaryId/execute-sync')
  @ApiOperation({
    summary: '执行临时工作流并等待结果',
    description: '执行临时工作流并等待执行完成，返回最终结果',
  })
  @UseGuards(WorkflowAuthGuard, CompatibleAuthGuard)
  async executeAndWaitForResult(@Req() req: IRequest, @Param('temporaryId') temporaryId: string, @Body() body: { inputData: Record<string, any> }) {
    const { teamId, userId } = req;
    const result = await this.temporaryWorkflowService.executeAndWaitForTemporaryWorkflow(temporaryId, body.inputData, teamId, userId);
    return new SuccessResponse({
      data: result,
    });
  }

  @Get('/:temporaryId/executions')
  @ApiOperation({
    summary: '查询临时工作流执行历史记录',
    description: '查询指定临时工作流的执行历史记录',
  })
  @UseGuards(WorkflowAuthGuard, CompatibleAuthGuard)
  async getTemporaryWorkflowExecutions(@Param('temporaryId') temporaryId: string, @Query('page') page = '1', @Query('limit') limit = '10') {
    const result = await this.temporaryWorkflowService.getTemporaryWorkflowExecutions(temporaryId, parseInt(page, 10), parseInt(limit, 10));
    return new SuccessResponse({
      data: result,
    });
  }
}
