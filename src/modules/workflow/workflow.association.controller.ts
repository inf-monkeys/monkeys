import { CompatibleAuthGuard } from '@/common/guards/auth.guard';
import { WorkflowAuthGuard } from '@/common/guards/workflow-auth.guard';
import { SuccessResponse } from '@/common/response';
import { IRequest } from '@/common/typings/request';
import { WorkflowAssociationsEntity } from '@/database/entities/workflow/workflow-association';
import { Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { WorkflowAssociationService } from './workflow.association.service';

@ApiTags('Workflows/Associations')
@Controller('/workflow')
export class WorkflowAssociationController {
  constructor(private readonly associationService: WorkflowAssociationService) { }

  @ApiOperation({
    summary: '获取工作流下的所有关联',
    description: '获取工作流下的所有关联',
  })
  @UseGuards(WorkflowAuthGuard, CompatibleAuthGuard)
  @Get('/:workflowId/associations')
  async listWorkflowAssociations(@Param('workflowId') workflowId: string, @Req() request: IRequest) {
    const { teamId } = request;
    const data = await this.associationService.listWorkflowAssociations(workflowId, teamId);
    return new SuccessResponse({ data });
  }

  @ApiOperation({
    summary: '在工作流下创建关联',
    description: '在工作流下创建关联',
  })
  @UseGuards(CompatibleAuthGuard)
  @Post('/:workflowId/associations')
  async createWorkflowAssociation(
    @Param('workflowId') workflowId: string,
    @Req() request: IRequest,
    @Body() body: Pick<WorkflowAssociationsEntity, 'displayName' | 'description' | 'enabled' | 'mapper' | 'targetWorkflowId' | 'iconUrl' | 'sortIndex'>,
  ) {
    const { teamId } = request;
    const data = await this.associationService.createWorkflowAssociation(workflowId, teamId, body);
    return new SuccessResponse({ data });
  }

  @ApiOperation({
    summary: '更新关联',
    description: '更新关联',
  })
  @UseGuards(CompatibleAuthGuard)
  @Put('/:workflowId/associations/:associationId')
  async updateWorkflowAssociation(
    @Param('workflowId') workflowId: string,
    @Param('associationId') associationId: string,
    @Req() request: IRequest,
    @Body() body: Pick<WorkflowAssociationsEntity, 'displayName' | 'description' | 'enabled' | 'mapper' | 'targetWorkflowId' | 'iconUrl' | 'sortIndex'>,
  ) {
    const { teamId } = request;
    const data = await this.associationService.updateWorkflowAssociation(associationId, teamId, body);
    return new SuccessResponse({ data });
  }

  @ApiOperation({
    summary: '删除关联',
    description: '删除关联',
  })
  @UseGuards(CompatibleAuthGuard)
  @Delete('/:workflowId/associations/:associationId')
  async removeWorkflowAssociation(@Param('associationId') associationId: string, @Req() request: IRequest) {
    const { teamId } = request;
    const data = await this.associationService.removeWorkflowAssociation(associationId, teamId);
    return new SuccessResponse({ data });
  }
}
