import { CompatibleAuthGuard } from '@/common/guards/auth.guard';
import { WorkflowAuthGuard } from '@/common/guards/workflow-auth.guard';
import { SuccessResponse } from '@/common/response';
import { IRequest } from '@/common/typings/request';
import { WorkflowTriggerType } from '@/database/entities/workflow/workflow-trigger';
import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SearchWorkflowExecutionsDto } from './dto/req/search-workflow-execution.dto';
import { StartWorkflowSyncDto } from './dto/req/start-workflow-sync.dto';
import { StartWorkflowDto } from './dto/req/start-workflow.dto';
import { UpdateTaskStatusDto } from './dto/req/update-task-status.dto';
import { DebugWorkflowDto } from './interfaces';
import { WorkflowExecutionService } from './workflow.execution.service';

@Controller('/workflow')
@ApiTags('Workflows/Execution')
@UseGuards(WorkflowAuthGuard, CompatibleAuthGuard)
export class WorkflowExecutionController {
  constructor(private readonly service: WorkflowExecutionService) {}

  @Post('/executions/search')
  @ApiOperation({
    summary: '搜索 workflow 的执行记录',
    description: '搜索 workflow 的执行记录',
  })
  public async searchWorkflowExecutions(@Req() req: IRequest, @Body() body: SearchWorkflowExecutionsDto) {
    const { teamId } = req;
    const result = await this.service.searchWorkflowExecutions(teamId, body);
    return new SuccessResponse({
      data: result,
    });
  }

  @Get('/executions/:workflowInstanceId/')
  @ApiOperation({
    summary: '获取某一次 workflow 执行实例的执行详情',
    description: '获取某一次 workflow 执行实例的执行详情',
  })
  public async getWorkflowInstanceExecutionDetail(@Req() req: IRequest, @Param('workflowInstanceId') workflowInstanceId: string) {
    const { teamId } = req;
    const result = await this.service.getWorkflowExecutionDetail(teamId, workflowInstanceId);
    return new SuccessResponse({
      data: result,
    });
  }

  @Delete('/executions/:workflowInstanceId/')
  @ApiOperation({
    summary: '删除某一次 workflow 执行实例',
    description: '删除某一次 workflow 执行实例',
  })
  public async deleteWorkflowInstanceExecution(@Req() req: IRequest, @Param('workflowInstanceId') workflowInstanceId: string) {
    const { teamId } = req;
    await this.service.deleteWorkflowExecution(teamId, workflowInstanceId);
    return new SuccessResponse({
      data: true,
    });
  }

  @Get('/executions/:workflowInstanceId/simple')
  @ApiOperation({
    summary: '获取某一次 workflow 执行实例的执行信息',
    description: '获取某一次 workflow 执行实例的执行信息',
  })
  public async getWorkflowInstanceExecutionSimpleDetail(@Req() req: IRequest, @Param('workflowInstanceId') workflowInstanceId: string) {
    const { teamId } = req;
    const result = await this.service.getWorkflowExecutionSimpleDetail(teamId, workflowInstanceId);
    return new SuccessResponse({
      data: result,
    });
  }

  @Get('/executions/:workflowId/outputs')
  @ApiOperation({
    summary: '获取 workflow 的执行输出',
    description: '获取 workflow 的执行输出',
  })
  public async getWorkflowExecutionOutputs(@Req() req: IRequest, @Param('workflowId') workflowId: string, @Query() query: { page: string; limit: string; orderBy: 'DESC' | 'ASC' }) {
    const { page = 1, limit = 10, orderBy = 'DESC' } = query;
    const result =
      workflowId === 'all'
        ? await this.service.getAllWorkflowsExecutionOutputs(req.teamId, { page: Number(page) || 1, limit: Number(limit) || 10, orderBy })
        : await this.service.getWorkflowExecutionOutputs(workflowId, Number(page) || 1, Number(limit) || 10);
    return {
      code: 200,
      message: 'ok',
      ...result,
    };
  }

  @Get('/executions/:workflowId/thumbnails')
  @ApiOperation({
    summary: '获取 workflow 的缩略图列表',
    description: '获取 workflow 的缩略图列表',
  })
  public async getWorkflowExecutionThumbnails(@Req() req: IRequest, @Param('workflowId') workflowId: string, @Query() query: { limit: string }) {
    const { limit = 5 } = query;
    const result = await this.service.getWorkflowExecutionThumbnails(workflowId, Number(limit) || 5);
    return new SuccessResponse({
      data: result,
    });
  }

  @Post('/executions/:workflowId/get-instance-by-image-url')
  @ApiOperation({
    summary: '根据图片 URL 获取 workflow 实例',
    description: '根据图片 URL 获取 workflow 实例',
  })
  public async getWorkflowInstanceByImageUrl(@Req() req: IRequest, @Param('workflowId') workflowId: string, @Body() body: { imageUrl: string; page?: number; limit: number }) {
    const { teamId } = req;
    const { imageUrl, page = 1, limit = 500 } = body;
    const result = await this.service.getWorkflowInstanceByImageUrl(teamId, workflowId, imageUrl, Number(page) || 1, Number(limit) || 500);
    return new SuccessResponse({
      data: result,
    });
  }

  @Post('/executions/:workflowId/start-sync')
  @ApiOperation({
    summary: '运行 workflow',
    description: '运行 workflow',
  })
  public async startWorkflowSync(@Req() req: IRequest, @Param('workflowId') workflowId: string, @Body() body: StartWorkflowSyncDto) {
    const { teamId, userId, apikey } = req;
    const { inputData, version } = body;
    const workflowInstanceId = await this.service.startWorkflow({
      teamId,
      userId,
      workflowId,
      inputData,
      version,
      triggerType: WorkflowTriggerType.MANUALLY,
      apiKey: apikey,
    });
    return await this.service.waitForWorkflowResult(teamId, workflowInstanceId);
  }

  @Post('/executions/:workflowId/start')
  @ApiOperation({
    summary: '运行 workflow',
    description: '运行 workflow',
  })
  public async startWorkflow(@Req() req: IRequest, @Param('workflowId') workflowId: string, @Body() body: StartWorkflowDto) {
    const { teamId, userId } = req;
    const { inputData, version, chatSessionId, waitForWorkflowFinished = false, group } = body;
    const workflowInstanceId = await this.service.startWorkflow({
      teamId,
      userId,
      workflowId,
      inputData,
      version,
      triggerType: WorkflowTriggerType.MANUALLY,
      chatSessionId,
      group,
    });

    if (waitForWorkflowFinished) {
      const result = await this.service.waitForWorkflowResult(teamId, workflowInstanceId);
      return new SuccessResponse({
        data: result,
      });
    } else {
      return new SuccessResponse({
        data: {
          workflowInstanceId,
        },
      });
    }
  }

  @Post('/executions/:workflowId/debug')
  @ApiOperation({
    summary: '调试 workflow',
    description: '调试 workflow',
  })
  public async debugWorkflow(@Req() req: IRequest, @Param('workflowId') workflowId: string, @Body() body: DebugWorkflowDto) {
    const { teamId, userId } = req;
    const { inputData, tasks } = body;
    const workflowInstanceId = await this.service.debugWorkflow({
      teamId,
      userId,
      workflowId,
      inputData,
      tasks,
    });
    return new SuccessResponse({
      data: workflowInstanceId,
    });
  }

  @Post('/executions/:workflowInstanceId/pause')
  @ApiOperation({
    summary: '暂停 workflow',
    description: '暂停 workflow',
  })
  public async pauseWorkflow(@Param('workflowInstanceId') workflowInstanceId: string) {
    const result = await this.service.pauseWorkflow(workflowInstanceId);
    return new SuccessResponse({
      data: result,
    });
  }

  @Post('/executions/:workflowInstanceId/resume')
  @ApiOperation({
    summary: '恢复执行 workflow',
    description: '恢复执行 workflow',
  })
  public async resumeWorkflow(@Param('workflowInstanceId') workflowInstanceId: string) {
    const result = await this.service.resumeWorkflow(workflowInstanceId);
    return new SuccessResponse({
      data: result,
    });
  }

  @Post('/executions/:workflowInstanceId/terminate')
  @ApiOperation({
    summary: '终止 workflow',
    description: '终止 workflow',
  })
  public async terminateWorkflow(@Param('workflowInstanceId') workflowInstanceId: string) {
    const result = await this.service.terminateWorkflow(workflowInstanceId);
    return new SuccessResponse({
      data: result,
    });
  }

  @Post('/executions/:workflowInstanceId/retry')
  @ApiOperation({
    summary: '重试 workflow',
    description: '重试 workflow（workflow 失败的情况下）',
  })
  public async retryWorkflow(@Param('workflowInstanceId') workflowInstanceId: string) {
    const result = await this.service.retryWorkflow(workflowInstanceId);
    return new SuccessResponse({
      data: result,
    });
  }

  @Post('/executions/:workflowInstanceId/tasks/:taskId')
  @ApiOperation({
    summary: '修改 workflow task 状态',
  })
  public async updateTaskStatus(@Param('workflowInstanceId') workflowInstanceId: string, @Param('taskId') taskId: string, @Body() dto: UpdateTaskStatusDto) {
    const result = await this.service.updateTaskStatus(workflowInstanceId, taskId, dto);
    return new SuccessResponse({
      data: result,
    });
  }
}
