import { TenantStaticsAuthGuard } from '@/common/guards/tenant-statics.guard';
import { Controller, Get, Head, UseGuards } from '@nestjs/common';
import { TenantService } from './tenant.service';

@Controller('tenant')
@UseGuards(TenantStaticsAuthGuard)
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  // @Post()
  // async create(@Body() createTenantDto: CreateTenantDto) {
  //   return await this.tenantService.create(createTenantDto);
  // }

  @Get()
  async findAll() {
    return await this.tenantService.findAll();
  }

  @Head()
  async isUp() {
    return 'Tenant Controller is up';
  }

  // @Get(':id')
  // async findOne(@Param('id') id: string) {
  //   return await this.tenantService.findOne(+id);
  // }

  // @Patch(':id')
  // async update(@Param('id') id: string, @Body() updateTenantDto: UpdateTenantDto) {
  //   return await this.tenantService.update(+id, updateTenantDto);
  // }

  // @Delete(':id')
  // async remove(@Param('id') id: string) {
  //   return await this.tenantService.remove(+id);
  // }
}
