import { ListDto } from '@/common/dto/list.dto';
import { CompatibleAuthGuard } from '@/common/guards/auth.guard';
import { SuccessListResponse, SuccessResponse } from '@/common/response';
import { IRequest } from '@/common/typings/request';
import { generateZip } from '@/common/utils/zip-asset';
import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, Res, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { CreateWorkflowDefDto } from './dto/req/create-workflow-def.dto';
import { GetWorkflowDto } from './dto/req/get-workflow.dto';
import { ImportWorkflowDto } from './dto/req/import-workflow.dto';
import { UpdateWorkflowDefDto } from './dto/req/update-workflow-def.dto';
import { WorkflowWithAssetsJson } from './interfaces';
import { WorkflowCrudService } from './workflow.curd.service';
import { WorkflowPageService } from './workflow.page.service';

@Controller('/workflow/metadata')
@ApiTags('Workflows/CRUD')
@UseGuards(CompatibleAuthGuard)
export class WorkflowCrudController {
  constructor(
    private readonly service: WorkflowCrudService,
    private readonly pageService: WorkflowPageService,
  ) {}

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
    const { version: versionStr } = dto;
    let version = undefined;
    if (versionStr) {
      version = parseInt(versionStr.toString());
    }
    const result = await this.service.getWorkflowDef(workflowId, version);
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
    let version = undefined;
    if (versionStr) {
      version = parseInt(versionStr.toString());
    }
    const workflow = await this.service.getWorkflowDef(workflowId, version);
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

  @Get('/:workflowId/export')
  @ApiOperation({
    summary: '导出 workflow',
    description: '导出 workflow',
  })
  public async exportWorkflow(
    @Req() req: IRequest,
    @Res() res: Response,
    @Param('workflowId') workflowId: string,
    @Query('version') versionStr: string,
    // @Query('exportAssets') exportAssetsStr: string,
  ) {
    let version = undefined;
    // const exportAssets = exportAssetsStr === '1' || exportAssetsStr === 'true';
    let json: WorkflowWithAssetsJson = {
      workflows: [],
      pages: [],
      sdModels: [],
      llmModels: [],
      textCollections: [],
      tableCollections: [],
      invalidAssetMessages: [],
    };
    if (versionStr) {
      version = parseInt(versionStr);
      const { workflow } = await this.service.exportWorkflowOfVersion(workflowId, version);
      const pages = await this.pageService.listWorkflowPagesBrief(workflowId);
      json.workflows = [workflow];
      json.pages = pages;
    } else {
      json = await this.service.exportWorkflow(workflowId);
    }

    // if (exportAssets) {
    //   const assets = await this.service.getWorkflowRelatedAssets(workflowId, version);
    //   json.llmModels = assets.llmModels;
    //   json.sdModels = assets.sdModels;
    //   json.tableCollections = assets.tableCollections;
    //   json.textCollections = assets.textCollections;
    // }

    const zipContent = await generateZip({
      workflows: [
        {
          workflows: json.workflows,
          pages: json.pages,
        },
      ],
      sdModels: json.sdModels,
      llmModels: json.llmModels,
      tableCollections: json.tableCollections,
      textCollections: json.textCollections,
    });
    const workflowName = json.workflows[0].name;
    const fileName = version ? `${workflowName}(版本${version})` : `${workflowName}(全部版本)`;
    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename=${encodeURIComponent(fileName)}.vines`,
    });

    res.send(zipContent);
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
    description: 'Clone workflow',
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
