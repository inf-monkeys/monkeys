import { SuccessResponse } from '@/common/response';
import { IRequest } from '@/common/typings/request';
import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { CreateWorkflowDefDto } from './dto/req/create-workflow-def.dto';
import { WorkflowCrudService } from './workflow.curd.service';

@Controller('/workflow/metadata')
export class WorkflowCrudController {
  constructor(private readonly service: WorkflowCrudService) {}

  @Get('/recently')
  @ApiOperation({
    summary: '获取近期使用的 workflows',
    description: '获取 7 天内更新过的 workflows',
  })
  public async getRecentlyUsedWorkflows(@Req() req: IRequest) {
    const data = await this.service.getRecentlyUsedWorkflows();
    return new SuccessResponse({
      data,
    });
  }

  @Post()
  @ApiOperation({
    summary: '创建 workflow 定义',
    description: '创建 workflow 定义',
  })
  public async createWorkflowDef(@Req() req: IRequest, @Body() body: CreateWorkflowDefDto) {
    const { teamId, userId } = req;
    const result = await this.service.createWorkflowDef();
    return new SuccessResponse({
      data: result,
    });
  }
}
