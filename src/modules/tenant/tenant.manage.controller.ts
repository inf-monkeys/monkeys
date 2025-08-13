import { TenantStatisticsAuthGuard } from '@/common/guards/tenant-statistics.guard';
import { SuccessResponse } from '@/common/response';
import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { TenantManageService } from './tenant.manage.service';

@Controller('tenant/manage')
@ApiTags('Tenant Manage')
@UseGuards(TenantStatisticsAuthGuard)
export class TenantManageController {
  constructor(private readonly tenantManageService: TenantManageService) {}

  @Post('/deleteAllTeamsExceptDefault')
  @ApiOperation({
    summary: '删除所有团队，除了默认团队',
    description: '删除所有团队，除了默认团队',
  })
  async deleteAllTeamsExceptDefault(@Body() body: { soft?: boolean }) {
    const result = await this.tenantManageService.deleteAllTeamsExceptDefault(body.soft);
    return new SuccessResponse({
      data: result,
    });
  }

  @Post('/initAllTeams')
  @ApiOperation({
    summary: '初始化所有团队',
    description: '初始化所有团队',
  })
  async initAllTeams() {
    const result = await this.tenantManageService.initAllTeams();
    return new SuccessResponse({
      data: result,
    });
  }
}
