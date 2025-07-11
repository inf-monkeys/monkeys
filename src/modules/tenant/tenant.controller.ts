import { TenantStatisticsAuthGuard } from '@/common/guards/tenant-statistics.guard';
import { SuccessListResponse, SuccessResponse } from '@/common/response';
import { Body, Controller, Get, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { SearchWorkflowExecutionsDto } from '../workflow/dto/req/search-workflow-execution.dto';
import { TenantService } from './tenant.service';

@Controller('tenant')
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
      extraMetadata?: Record<string, any> | Record<string, any>[] | string;
      workflowWithExtraMetadata?: boolean;
      freeText?: string;
      status?: string[];
      startTimeFrom?: number;
      startTimeTo?: number;
      workflowId?: string;
      workflowInstanceId?: string;
      versions?: number[];
      time?: number;
    },
  ) {
    const { page = 1, limit = 20, extraMetadata, workflowWithExtraMetadata, freeText, status, startTimeFrom, startTimeTo, workflowId, workflowInstanceId, versions, time } = body;

    // 处理 extraMetadata 参数解码
    let decodedExtraMetadata = extraMetadata;
    if (typeof extraMetadata === 'string' && extraMetadata !== '') {
      try {
        // 首先尝试 URL 解码
        const urlDecoded = decodeURIComponent(extraMetadata);
        // 然后尝试 JSON 解析
        decodedExtraMetadata = JSON.parse(urlDecoded);
      } catch (e1) {
        try {
          // 如果 URL 解码失败，尝试 Base64 解码
          const base64Decoded = Buffer.from(extraMetadata, 'base64').toString('utf-8');
          decodedExtraMetadata = JSON.parse(base64Decoded);
        } catch (e2) {
          // 如果都失败，保持原始值
          console.warn('Failed to decode extraMetadata in controller', { original: extraMetadata, errors: [e1.message, e2.message] });
        }
      }
    }

    const { data, total } = await this.tenantService.getAllExecutions({
      page: +page,
      limit: +limit,
      extraMetadata: decodedExtraMetadata as Record<string, any> | Record<string, any>[],
      workflowWithExtraMetadata,
      freeText,
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
    // 处理 extraMetadata 参数解码
    const decodedBody = { ...body };
    if (body.extraMetadata && typeof body.extraMetadata === 'string' && body.extraMetadata !== '') {
      try {
        // 首先尝试 URL 解码
        const urlDecoded = decodeURIComponent(body.extraMetadata);
        // 然后尝试 JSON 解析
        decodedBody.extraMetadata = JSON.parse(urlDecoded);
      } catch (e1) {
        try {
          // 如果 URL 解码失败，尝试 Base64 解码
          const base64Decoded = Buffer.from(body.extraMetadata, 'base64').toString('utf-8');
          decodedBody.extraMetadata = JSON.parse(base64Decoded);
        } catch (e2) {
          // 如果都失败，保持原始值
          console.warn('Failed to decode extraMetadata in search controller', { original: body.extraMetadata, errors: [e1.message, e2.message] });
        }
      }
    }

    const result = await this.tenantService.searchWorkflowExecutionsForTeam(teamId, decodedBody);
    return new SuccessResponse({
      data: result,
    });
  }
}
