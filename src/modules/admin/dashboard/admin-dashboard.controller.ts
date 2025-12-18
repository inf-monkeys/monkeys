import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AdminJwtGuard } from '../guards/admin-jwt.guard';
import { AdminDashboardService } from './admin-dashboard.service';
import { AdminDashboardStatsDto } from './dto/admin-dashboard.dto';

@ApiTags('Admin - Dashboard')
@Controller('admin/dashboard')
@UseGuards(AdminJwtGuard)
@ApiBearerAuth()
export class AdminDashboardController {
  constructor(private readonly service: AdminDashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: '获取管理后台首页统计数据' })
  @ApiResponse({ status: 200, type: AdminDashboardStatsDto })
  async stats(): Promise<AdminDashboardStatsDto> {
    return this.service.getStats();
  }
}

