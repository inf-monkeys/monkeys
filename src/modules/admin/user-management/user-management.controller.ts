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
import { AdminPermissions } from '../decorators/admin-permissions.decorator';
import { AdminJwtGuard } from '../guards/admin-jwt.guard';
import { AdminPermissionsGuard } from '../guards/admin-permissions.guard';
import { UserManagementService } from './user-management.service';
import {
  CreateUserDto,
  QueryUserListDto,
  ResetUserPasswordDto,
  UpdateUserDto,
  UserListResponseDto,
  UserManagementItemDto,
} from './dto/user-management.dto';

@ApiTags('Admin - Users')
@Controller('admin/users')
@UseGuards(AdminJwtGuard, AdminPermissionsGuard)
@ApiBearerAuth()
export class UserManagementController {
  constructor(private readonly service: UserManagementService) {}

  @Get()
  @AdminPermissions('user:read')
  @ApiOperation({ summary: '分页获取平台用户列表' })
  @ApiResponse({ status: 200, type: UserListResponseDto })
  async list(@Query() query: QueryUserListDto): Promise<UserListResponseDto> {
    return this.service.listUsers(query);
  }

  @Get(':id')
  @AdminPermissions('user:read')
  @ApiOperation({ summary: '获取平台用户详情' })
  @ApiResponse({ status: 200, type: UserManagementItemDto })
  async get(@Param('id') id: string): Promise<UserManagementItemDto> {
    return this.service.getUser(id);
  }

  @Post()
  @AdminPermissions('user:write')
  @ApiOperation({ summary: '创建平台用户（密码由前端生成随机密码）' })
  @ApiResponse({ status: 201, type: UserManagementItemDto })
  async create(@Body() body: CreateUserDto): Promise<UserManagementItemDto> {
    return this.service.createUser(body);
  }

  @Put(':id')
  @AdminPermissions('user:write')
  @ApiOperation({ summary: '更新平台用户信息' })
  @ApiResponse({ status: 200, type: UserManagementItemDto })
  async update(@Param('id') id: string, @Body() body: UpdateUserDto): Promise<UserManagementItemDto> {
    return this.service.updateUser(id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  @AdminPermissions('user:delete')
  @ApiOperation({ summary: '删除平台用户（软删除）' })
  @ApiResponse({ status: 204 })
  async delete(@Param('id') id: string): Promise<void> {
    await this.service.deleteUser(id);
  }

  @Post(':id/reset-password')
  @HttpCode(204)
  @AdminPermissions('user:write')
  @ApiOperation({ summary: '重置平台用户密码（由前端生成随机密码）' })
  @ApiResponse({ status: 204 })
  async resetPassword(@Param('id') id: string, @Body() body: ResetUserPasswordDto): Promise<void> {
    await this.service.resetPassword(id, body.password);
  }
}
