import { TenantStatisticsAuthGuard } from '@/common/guards/tenant-statistics.guard';
import { SuccessResponse } from '@/common/response';
import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
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
  async findBetween(@Body() body: { startTime: number; endTime: number }) {
    const result = await this.tenantService.findBetween(body.startTime, body.endTime);
    return new SuccessResponse({
      data: result,
    });
  }
}
