import { config } from '@/common/config';
import { WorkflowExecutionContext } from '@/common/dto/workflow-execution-context.dto';
import { CompatibleAuthGuard } from '@/common/guards/auth.guard';
import { SuccessResponse } from '@/common/response';
import { IRequest } from '@/common/typings/request';
import { WorkflowTriggerType } from '@/database/entities/workflow/workflow-trigger';
import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SearchWorkflowExecutionsDto } from './dto/req/search-workflow-execution.dto';
import { StartWorkflowDto } from './dto/req/start-workflow.dto';
import { WorkflowExecutionService } from './workflow.execution.service';

@Controller('/workflow')
@ApiTags('Workflows/Execution')
@UseGuards(CompatibleAuthGuard)
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

  @Post('/executions/:workflowId/start')
  @ApiOperation({
    summary: '运行 workflow',
    description: '运行 workflow',
  })
  public async startWorkflow(@Req() req: IRequest, @Param('workflowId') workflowId: string, @Body() body: StartWorkflowDto) {
    const { teamId, userId } = req;
    const workflowContext: WorkflowExecutionContext = {
      userId,
      teamId: teamId,
      appId: config.server.appId,
      appUrl: config.server.appUrl,
    };
    const { inputData, version, chatSessionId, waitForWorkflowFinished = false } = body;
    const workflowInstanceId = await this.service.startWorkflow({
      teamId,
      userId,
      workflowId,
      inputData,
      version,
      workflowContext,
      triggerType: WorkflowTriggerType.MANUALLY,
      chatSessionId,
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
}
