import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AdminJwtGuard } from '../guards/admin-jwt.guard';
import { AdminSuperAdminGuard } from '../guards/admin-super-admin.guard';
import {
  AdminRoleItemDto,
  CreateAdminRoleDto,
  SetRolePermissionsDto,
  UpdateAdminRoleDto,
} from './dto/rbac-management.dto';
import { RbacManagementService } from './rbac-management.service';

@ApiTags('Admin - RBAC')
@Controller('admin/roles')
@UseGuards(AdminJwtGuard, AdminSuperAdminGuard)
@ApiBearerAuth()
export class AdminRoleManagementController {
  constructor(private readonly service: RbacManagementService) {}

  @Get()
  @ApiOperation({ summary: '获取角色列表（不包含 super_admin）' })
  @ApiResponse({ status: 200, type: [AdminRoleItemDto] })
  async list(): Promise<AdminRoleItemDto[]> {
    return this.service.listRoles();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取角色详情' })
  @ApiResponse({ status: 200, type: AdminRoleItemDto })
  async get(@Param('id') id: string): Promise<AdminRoleItemDto> {
    return this.service.getRole(id);
  }

  @Post()
  @ApiOperation({ summary: '创建角色' })
  @ApiResponse({ status: 201, type: AdminRoleItemDto })
  async create(@Body() body: CreateAdminRoleDto): Promise<AdminRoleItemDto> {
    return this.service.createRole(body);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新角色' })
  @ApiResponse({ status: 200, type: AdminRoleItemDto })
  async update(@Param('id') id: string, @Body() body: UpdateAdminRoleDto): Promise<AdminRoleItemDto> {
    return this.service.updateRole(id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: '删除角色（软删除，系统角色不可删除）' })
  @ApiResponse({ status: 204 })
  async delete(@Param('id') id: string): Promise<void> {
    await this.service.deleteRole(id);
  }

  @Put(':id/permissions')
  @ApiOperation({ summary: '设置角色权限（整量覆盖）' })
  @ApiResponse({ status: 200, type: AdminRoleItemDto })
  async setPermissions(
    @Param('id') id: string,
    @Body() body: SetRolePermissionsDto,
  ): Promise<AdminRoleItemDto> {
    return this.service.setRolePermissions(id, body);
  }
}

