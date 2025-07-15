import { TenantStatisticsAuthGuard } from '@/common/guards/tenant-statistics.guard';
import { SuccessListResponse, SuccessResponse } from '@/common/response';
import { Body, Controller, Get, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateTemporaryWorkflowDto } from '../workflow/dto/req/create-temporary-workflow.dto';
import { SearchWorkflowExecutionsDto } from '../workflow/dto/req/search-workflow-execution.dto';
import { TenantService } from './tenant.service';

@Controller('tenant')
@ApiTags('Tenant')
@UseGuards(TenantStatisticsAuthGuard)
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Get()
  async findAll() {
    const result = await this.tenantService.findAll();
    return new SuccessResponse({
      data: result,
    });
  }

  @Post()
  @HttpCode(200)
  async findBetween(@Body() body: { startTime: number; endTime: number }) {
    const result = await this.tenantService.findBetween(body.startTime, body.endTime);
    return new SuccessResponse({
      data: result,
    });
  }

  @Post('/outputs')
  async getAllExecutionOutputs(
    @Body()
    body: {
      page?: number;
      limit?: number;
      extraMetadata?: Record<string, any> | Record<string, any>[];
      workflowWithExtraMetadata?: boolean;
      searchText?: string;
      status?: string[];
      startTimeFrom?: number;
      startTimeTo?: number;
      workflowId?: string;
      workflowInstanceId?: string;
      versions?: number[];
      time?: number;
    },
  ) {
    const { page = 1, limit = 20, extraMetadata, workflowWithExtraMetadata, searchText, status, startTimeFrom, startTimeTo, workflowId, workflowInstanceId, versions, time } = body;

    const { data, total } = await this.tenantService.getAllExecutions({
      page: +page,
      limit: +limit,
      extraMetadata,
      workflowWithExtraMetadata,
      searchText,
      status,
      startTimeFrom,
      startTimeTo,
      workflowId,
      workflowInstanceId,
      versions,
      time,
    });

    return new SuccessListResponse({
      data,
      total,
      page: +page,
      limit: +limit,
    });
  }

  @Post('/teams/:teamId/workflow-executions/search')
  @HttpCode(200)
  public async searchTeamWorkflowExecutions(@Param('teamId') teamId: string, @Body() body: SearchWorkflowExecutionsDto) {
    const result = await this.tenantService.searchWorkflowExecutionsForTeam(teamId, body);
    return new SuccessResponse({
      data: result,
    });
  }

  // 临时工作流相关接口
  @Post('/temporary-workflow/create')
  @ApiOperation({
    summary: '创建临时工作流（租户鉴权）',
    description: '为外部系统创建临时工作流，返回临时ID',
  })
  async createTemporaryWorkflow(@Body() dto: CreateTemporaryWorkflowDto) {
    const result = await this.tenantService.createTemporaryWorkflow(dto);
    return new SuccessResponse({
      data: result,
    });
  }

  @Get('/temporary-workflow/:temporaryId/info')
  @ApiOperation({
    summary: '获取临时工作流信息（支持租户鉴权）',
    description: '根据临时ID获取工作流信息',
  })
  async getTemporaryWorkflowInfo(@Param('temporaryId') temporaryId: string) {
    const result = await this.tenantService.getTemporaryWorkflowInfo(temporaryId);
    return new SuccessResponse({
      data: result,
    });
  }

  @Post('/temporary-workflow/:temporaryId/execute')
  @ApiOperation({
    summary: '执行临时工作流（支持租户鉴权）',
    description: '执行指定的临时工作流',
  })
  async executeTemporaryWorkflow(@Param('temporaryId') temporaryId: string) {
    const result = await this.tenantService.executeTemporaryWorkflow(temporaryId);
    return new SuccessResponse({
      data: result,
    });
  }

  @Get('/temporary-workflow/:temporaryId/result')
  @ApiOperation({
    summary: '获取临时工作流执行结果（支持租户鉴权）',
    description: '获取临时工作流的执行结果',
  })
  async getTemporaryWorkflowResult(@Param('temporaryId') temporaryId: string) {
    const result = await this.tenantService.getTemporaryWorkflowResult(temporaryId);
    return new SuccessResponse({
      data: result,
    });
  }

  @Post('/temporary-workflow/:temporaryId/execute-and-wait')
  @ApiOperation({
    summary: '执行临时工作流并等待结果（支持租户鉴权）',
    description: '执行临时工作流并等待执行完成，返回最终结果',
  })
  async executeAndWaitForResult(@Param('temporaryId') temporaryId: string) {
    const result = await this.tenantService.executeAndWaitForTemporaryWorkflow(temporaryId);
    return new SuccessResponse({
      data: result,
    });
  }
}
