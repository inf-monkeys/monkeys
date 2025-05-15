import { config } from '@/common/config';
import { SuccessResponse } from '@/common/response';
import { Controller, Get, Query } from '@nestjs/common';
import { TenantService } from './tenant.service';
@Controller('tenant')
// @UseGuards(TenantStatisticsAuthGuard)
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  // @Get()
  // @Get()
  async findAll() {
    const result = await this.tenantService.findAll();
    return new SuccessResponse({
      data: result,
    });
  }

  // @Get()
  // @Get()
  async findBetween(@Query() startTime: number, @Query() endTime: number) {
    const result = await this.tenantService.findBetween(startTime, endTime);
    return new SuccessResponse({
      data: result,
    });
  }

  @Get()
  async getConfig() {
    return config.tenant.bearer;
  }
}
