import { TenantStaticsAuthGuard } from '@/common/guards/tenant-statics.guard';
import { SuccessResponse } from '@/common/response';
import { Controller, Get, UseGuards } from '@nestjs/common';
import { TenantService } from './tenant.service';


@Controller('tenant')
@UseGuards(TenantStaticsAuthGuard)
export class TenantController {
  constructor(
    private readonly tenantService: TenantService,
  ) { }

  // @Post()
  // async create(@Body() createTenantDto: CreateTenantDto) {
  //   return await this.tenantService.create(createTenantDto);
  // }

  @Get()
  async findAll() {
    const result = await this.tenantService.findAll();
    return new SuccessResponse({
      data: result,
    });
  }
}
