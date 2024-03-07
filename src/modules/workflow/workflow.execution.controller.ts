import { SuccessResponse } from '@/common/response';
import { IRequest } from '@/common/typings/request';
import { Body, Controller, Post, Req } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { SearchWorkflowExecutionsDto } from './dto/req/search-workflow-execution.dto';
import { WorkflowExecutionService } from './workflow.execution.service';

@Controller('/workflow')
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
}
