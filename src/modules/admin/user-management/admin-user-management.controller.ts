import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentAdmin } from '../decorators/current-admin.decorator';
import { AdminPermissions } from '../decorators/admin-permissions.decorator';
import { AdminJwtGuard } from '../guards/admin-jwt.guard';
import { AdminPermissionsGuard } from '../guards/admin-permissions.guard';
import { AdminUserDto } from '../auth/dto/admin-user.dto';
import { AdminUserManagementService } from './admin-user-management.service';
import {
  AdminUserListResponseDto,
  AdminUserManagementItemDto,
  CreateAdminUserDto,
  QueryAdminUserListDto,
  ResetAdminPasswordDto,
  UpdateAdminUserDto,
} from './dto/admin-user-management.dto';

@ApiTags('Admin - Admin Users')
@Controller('admin/admin-users')
@UseGuards(AdminJwtGuard, AdminPermissionsGuard)
@ApiBearerAuth()
export class AdminUserManagementController {
  constructor(private readonly service: AdminUserManagementService) {}

  @Get()
  @AdminPermissions('admin:read')
  @ApiOperation({ summary: '分页获取普通管理员列表（不包含 super_admin）' })
  @ApiResponse({ status: 200, type: AdminUserListResponseDto })
  async list(@Query() query: QueryAdminUserListDto): Promise<AdminUserListResponseDto> {
    return this.service.listAdmins(query);
  }

  @Get(':id')
  @AdminPermissions('admin:read')
  @ApiOperation({ summary: '获取普通管理员详情' })
  @ApiResponse({ status: 200, type: AdminUserManagementItemDto })
  async get(@Param('id') id: string): Promise<AdminUserManagementItemDto> {
    return this.service.getAdmin(id);
  }

  @Post()
  @AdminPermissions('admin:write')
  @ApiOperation({ summary: '创建普通管理员（密码由前端生成随机密码）' })
  @ApiResponse({ status: 201, type: AdminUserManagementItemDto })
  async create(
    @CurrentAdmin() admin: AdminUserDto,
    @Body() body: CreateAdminUserDto,
  ): Promise<AdminUserManagementItemDto> {
    return this.service.createAdmin(body, admin.id);
  }

  @Put(':id')
  @AdminPermissions('admin:write')
  @ApiOperation({ summary: '更新普通管理员信息' })
  @ApiResponse({ status: 200, type: AdminUserManagementItemDto })
  async update(@Param('id') id: string, @Body() body: UpdateAdminUserDto): Promise<AdminUserManagementItemDto> {
    return this.service.updateAdmin(id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  @AdminPermissions('admin:delete')
  @ApiOperation({ summary: '删除普通管理员（软删除）' })
  @ApiResponse({ status: 204 })
  async delete(@Param('id') id: string): Promise<void> {
    await this.service.deleteAdmin(id);
  }

  @Post(':id/reset-password')
  @HttpCode(204)
  @AdminPermissions('admin:write')
  @ApiOperation({ summary: '重置普通管理员密码（由前端生成随机密码）' })
  @ApiResponse({ status: 204 })
  async resetPassword(@Param('id') id: string, @Body() body: ResetAdminPasswordDto): Promise<void> {
    await this.service.resetPassword(id, body.password);
  }
}
