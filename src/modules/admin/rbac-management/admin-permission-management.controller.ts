import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AdminJwtGuard } from '../guards/admin-jwt.guard';
import { AdminSuperAdminGuard } from '../guards/admin-super-admin.guard';
import { AdminPermissionItemDto } from './dto/rbac-management.dto';
import { RbacManagementService } from './rbac-management.service';

@ApiTags('Admin - RBAC')
@Controller('admin/permissions')
@UseGuards(AdminJwtGuard, AdminSuperAdminGuard)
@ApiBearerAuth()
export class AdminPermissionManagementController {
  constructor(private readonly service: RbacManagementService) {}

  @Get()
  @ApiOperation({ summary: '获取权限列表（仅展示）' })
  @ApiResponse({ status: 200, type: [AdminPermissionItemDto] })
  async list(): Promise<AdminPermissionItemDto[]> {
    return this.service.listPermissions();
  }
}

