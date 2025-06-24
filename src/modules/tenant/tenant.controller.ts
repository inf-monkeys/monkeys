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
  async getAllExecutionOutputs(@Body() body: { page?: number; limit?: number; extraMetadata?: Record<string, any> }) {
    const { page = 1, limit = 20, extraMetadata } = body;
    const { data, total } = await this.tenantService.getAllExecutions({ page: +page, limit: +limit, extraMetadata });
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
}
