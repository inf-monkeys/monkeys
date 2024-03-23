import { ListDto } from '@/common/dto/list.dto';
import { CompatibleAuthGuard } from '@/common/guards/auth.guard';
import { SuccessListResponse, SuccessResponse } from '@/common/response';
import { IRequest } from '@/common/typings/request';
import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateWorkflowDefDto } from './dto/req/create-workflow-def.dto';
import { GetWorkflowDto } from './dto/req/get-workflow.dto';
import { ImportWorkflowDto } from './dto/req/import-workflow.dto';
import { UpdateWorkflowDefDto } from './dto/req/update-workflow-def.dto';
import { WorkflowCrudService } from './workflow.curd.service';

@Controller('/workflow/metadata')
@ApiTags('Workflows/CRUD')
@UseGuards(CompatibleAuthGuard)
export class WorkflowCrudController {
  constructor(private readonly service: WorkflowCrudService) {}

  @Get('/')
  @ApiOperation({
    summary: '获取工作流列表',
    description: '获取工作流列表',
  })
  public async listWorkflows(@Req() req: IRequest, @Query() query: ListDto) {
    const { teamId } = req;
    const { page, limit } = query;
    const { totalCount, list } = await this.service.listWorkflows(teamId, query);
    return new SuccessListResponse({ data: list, total: totalCount, page: +page, limit: +limit });
  }

  @Get('/:workflowId')
  @ApiOperation({
    summary: '获取 workflow 定义',
    description: '获取 workflow 定义',
  })
  public async getWorkflowDef(@Req() req: IRequest, @Param('workflowId') workflowId: string, @Query() dto: GetWorkflowDto) {
    const { teamId } = req;
    const { version: versionStr } = dto;
    let version = undefined;
    if (versionStr) {
      version = parseInt(versionStr.toString());
    }
    const result = await this.service.getWorkflowDef(teamId, workflowId, version);
    return new SuccessResponse({
      data: result,
    });
  }

  @Get('/:workflowId/versions')
  @ApiOperation({
    summary: '获取工作流的所有版本',
    description: '获取工作流的所有版本',
  })
  public async getWorkflowVersions(@Req() req: IRequest, @Param('workflowId') workflowId: string) {
    const result = await this.service.getWorklfowVersions(workflowId);
    return new SuccessResponse({
      data: result,
    });
  }

  @Get('/:workflowId/validation-issues')
  @ApiOperation({
    summary: '获取工作流的所有版本',
    description: '获取工作流的所有版本',
  })
  public async getWorkflowValicationIssues(@Req() req: IRequest, @Param('workflowId') workflowId: string, @Query('version') versionStr: string) {
    const { teamId } = req;
    let version = undefined;
    if (versionStr) {
      version = parseInt(versionStr.toString());
    }
    const workflow = await this.service.getWorkflowDef(teamId, workflowId, version);
    return new SuccessResponse({
      data: {
        validationIssues: workflow.validationIssues || [],
        validated: workflow.validated,
      },
    });
  }

  @Post()
  @ApiOperation({
    summary: '创建 workflow 定义',
    description: '创建 workflow 定义',
  })
  public async createWorkflowDef(@Req() req: IRequest, @Body() body: CreateWorkflowDefDto) {
    const { teamId, userId } = req;
    const { name, description, tasks, variables, output, iconUrl, triggers } = body;
    const workflowId = await this.service.createWorkflowDef(teamId, userId, {
      name,
      description,
      iconUrl,
      tasks,
      variables,
      output,
      triggers,
    });
    return new SuccessResponse({
      data: {
        workflowId,
      },
    });
  }

  @Put('/:workflowId')
  @ApiOperation({
    summary: '更新 workflow 定义',
    description: '更新 workflow 定义',
  })
  public async updateWorkflowDef(@Req() req: IRequest, @Param('workflowId') workflowId: string, @Body() body: UpdateWorkflowDefDto) {
    const { teamId } = req;
    const { version = 1 } = body;
    const { validationIssues, validated } = await this.service.updateWorkflowDef(teamId, workflowId, version, body);
    return new SuccessResponse({
      data: {
        success: true,
        validationIssues,
        validated,
      },
    });
  }

  @Post('/import-from-zip')
  @ApiOperation({
    summary: '使用 zip 导入 workflow',
    description: '使用 zip 导入 workflow',
  })
  public async importWorkflowByZip(@Req() req: IRequest, @Body() body: ImportWorkflowDto) {
    const { teamId, userId } = req;
    const { zipUrl } = body;
    const { newWorkflowId } = await this.service.importWorkflowByZip(teamId, userId, zipUrl);
    return new SuccessResponse({
      data: {
        workflowId: newWorkflowId,
      },
    });
  }

  @Post('/:workflowId/clone')
  @ApiOperation({
    summary: 'Clone workflow',
    description: 'Clone worfklow',
  })
  public async cloneWorkflow(@Req() req: IRequest, @Param('workflowId') workflowId: string) {
    const { teamId, userId } = req;
    const newWorkflowId = await this.service.cloneWorkflow(teamId, userId, workflowId);
    return new SuccessResponse({
      data: {
        workflowId: newWorkflowId,
      },
    });
  }

  @Delete('/:workflowId')
  @ApiOperation({
    summary: '删除 workflow 定义',
    description: '删除 workflow 定义',
  })
  public async deleteWorkflowDef(@Req() req: IRequest, @Param('workflowId') workflowId: string) {
    const { teamId } = req;
    const result = await this.service.deleteWorkflowDef(teamId, workflowId);
    return new SuccessResponse({
      data: result,
    });
  }
}
