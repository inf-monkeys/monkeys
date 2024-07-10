import { CompatibleAuthGuard } from '@/common/guards/auth.guard';
import { SuccessResponse } from '@/common/response';
import { IRequest } from '@/common/typings/request';
import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateWorkflowTriggerDto } from './dto/req/create-trigger.dto';
import { UpdateWorkflowTriggerDto } from './dto/req/update-trigger.dto';
import { WorkflowTriggerService } from './workflow.trigger.service';
import { WorkflowAuthGuard } from '@/common/guards/workflow-auth.guard';

@Controller('workflow/')
@ApiTags('Workflows/Trigger')
@UseGuards(WorkflowAuthGuard, CompatibleAuthGuard)
export class WorkflowTriggerController {
  constructor(private readonly service: WorkflowTriggerService) {}

  @Get('/trigger-types')
  @ApiOperation({
    summary: '获取触发器类型',
    description: '获取触发器类型',
  })
  public async getTriggerTypes() {
    return new SuccessResponse({
      data: await this.service.listTriggerTypes(),
    });
  }

  @Post('/:workflowId/triggers')
  @ApiOperation({
    summary: '创建触发器',
    description: '创建触发器',
  })
  public async createTrigger(@Req() req: IRequest, @Param('workflowId') workflowId: string, @Body() dto: CreateWorkflowTriggerDto) {
    const triggerId = await this.service.createWorkflowTrigger(workflowId, dto);
    return new SuccessResponse({
      data: {
        triggerId,
      },
    });
  }

  @Get('/:workflowId/triggers')
  @ApiOperation({
    summary: '获取触发器列表',
    description: '获取触发器列表',
  })
  public async listTriggers(@Req() req: IRequest, @Param('workflowId') workflowId: string, @Query('version') versionStr: string) {
    const version = parseInt(versionStr);
    const data = await this.service.listWorkflowTriggers(workflowId, version);
    return new SuccessResponse({
      data,
    });
  }

  @Put('/:workflowId/triggers/:triggerId')
  @ApiOperation({
    summary: '修改触发器',
    description: '修改触发器',
  })
  public async updateTrigger(@Req() req: IRequest, @Param('workflowId') workflowId: string, @Param('triggerId') triggerId: string, @Body() dto: UpdateWorkflowTriggerDto) {
    const data = await this.service.updateWorkflowTrigger(triggerId, dto);
    return new SuccessResponse({
      data,
    });
  }

  @Delete('/:workflowId/triggers/:triggerId')
  @ApiOperation({
    summary: '删除触发器',
    description: '删除触发器',
  })
  public async deleteTrigger(@Req() req: IRequest, @Param('workflowId') workflowId: string, @Param('triggerId') triggerId: string) {
    const data = await this.service.deleteWorkflowTrigger(workflowId, triggerId);
    return new SuccessResponse({
      data,
    });
  }
}
