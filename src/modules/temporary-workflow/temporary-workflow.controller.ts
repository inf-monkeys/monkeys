import { CompatibleAuthGuard } from '@/common/guards/auth.guard';
import { WorkflowAuthGuard } from '@/common/guards/workflow-auth.guard';
import { SuccessResponse } from '@/common/response';
import { IRequest } from '@/common/typings/request';
import { Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { TemporaryWorkflowService } from './temporary-workflow.service';

@Controller('/temporary-workflow')
export class TemporaryWorkflowController {
  constructor(private readonly temporaryWorkflowService: TemporaryWorkflowService) {}

  @Post('/:temporaryId/execute')
  @ApiOperation({
    summary: '执行临时工作流',
    description: '执行指定的临时工作流',
  })
  @UseGuards(WorkflowAuthGuard, CompatibleAuthGuard)
  async executeTemporaryWorkflow(@Req() req: IRequest, @Param('temporaryId') temporaryId: string) {
    const { teamId, userId } = req;
    const result = await this.temporaryWorkflowService.executeTemporaryWorkflow(temporaryId, teamId, userId);
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
  async executeAndWaitForResult(@Req() req: IRequest, @Param('temporaryId') temporaryId: string) {
    const { teamId, userId } = req;
    const result = await this.temporaryWorkflowService.executeAndWaitForTemporaryWorkflow(temporaryId, teamId, userId);
    return new SuccessResponse({
      data: result,
    });
  }
}
