import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdminAuthService } from './admin-auth.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import {
  AdminLoginResponseDto,
  SuperAdminInitResponseDto,
  AdminUserDto,
} from './dto/admin-user.dto';
import { config } from '@/common/config';

@ApiTags('Admin Auth')
@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  /**
   * 初始化 SuperAdmin
   * 需要在请求头中携带 X-Init-Token
   */
  @Get('super-admin/init')
  @ApiOperation({ summary: '初始化 SuperAdmin（首次部署时使用）' })
  @ApiResponse({
    status: 200,
    description: 'SuperAdmin 初始化成功',
    type: SuperAdminInitResponseDto,
  })
  async initSuperAdmin(
    @Headers('x-init-token') initToken: string,
  ): Promise<SuperAdminInitResponseDto> {
    // 验证 Init Token
    const configToken = config.admin?.initToken;
    if (!configToken || initToken !== configToken) {
      throw new UnauthorizedException('Invalid init token');
    }

    return this.adminAuthService.initSuperAdmin();
  }

  /**
   * 管理员登录
   */
  @Post('login')
  @ApiOperation({ summary: '管理员登录' })
  @ApiResponse({
    status: 200,
    description: '登录成功',
    type: AdminLoginResponseDto,
  })
  async login(@Body() loginDto: AdminLoginDto): Promise<AdminLoginResponseDto> {
    return this.adminAuthService.login(loginDto);
  }

  /**
   * 获取当前登录的管理员信息
   * TODO: 添加 AdminJwtGuard 和 CurrentAdmin decorator
   */
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取当前管理员信息' })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    type: AdminUserDto,
  })
  async getCurrentUser(
    @Headers('authorization') authorization: string,
  ): Promise<AdminUserDto> {
    // 临时实现：从 Authorization header 中提取 token
    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    const token = authorization.substring(7);
    return this.adminAuthService.validateToken(token);
  }
}
