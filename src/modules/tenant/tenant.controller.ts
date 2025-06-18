import { ListDto } from '@/common/dto/list.dto';
import { TenantStatisticsAuthGuard } from '@/common/guards/tenant-statistics.guard';
import { SuccessListResponse, SuccessResponse } from '@/common/response';
import { Body, Controller, Get, HttpCode, Post, Query, UseGuards } from '@nestjs/common';
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

  @Get('/outputs')
  async getAllExecutionOutputs(@Query() query: ListDto) {
    const { page = 1, limit = 20 } = query;
    const { data, total } = await this.tenantService.getAllExecutions({ page: +page, limit: +limit });
    return new SuccessListResponse({
      data,
      total,
      page: +page,
      limit: +limit,
    });
  }
}
