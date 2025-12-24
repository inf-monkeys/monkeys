import { config } from '@/common/config';
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AdminAuthService } from '@/modules/admin/auth/admin-auth.service';

/**
 * 组合鉴权守卫：支持管理员 JWT 或租户 Bearer Token
 *
 * 鉴权策略（OR 逻辑）：
 * 1. 优先尝试管理员 JWT 鉴权
 * 2. 如果管理员鉴权失败，尝试租户 Bearer Token 鉴权
 * 3. 两种方式都失败则拒绝访问
 *
 * 使用场景：
 * - 需要同时支持管理员和租户级别访问的接口
 * - 例如：数据资产管理、统计查询等
 */
@Injectable()
export class AdminOrTenantGuard implements CanActivate {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authorization = request.headers.authorization;

    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    const token = authorization.substring(7);

    // 策略 1: 尝试管理员 JWT 鉴权
    try {
      const adminUser = await this.adminAuthService.validateToken(token);
      request.adminUser = adminUser;
      request.authType = 'admin'; // 标记认证类型
      return true;
    } catch (adminError) {
      // 管理员鉴权失败，继续尝试租户鉴权
    }

    // 策略 2: 尝试租户 Bearer Token 鉴权
    const configToken = config.tenant.bearer;
    if (configToken && configToken === token) {
      request.authType = 'tenant'; // 标记认证类型
      return true;
    }

    // 两种鉴权都失败
    throw new UnauthorizedException(
      'Invalid token: neither valid admin JWT nor tenant bearer token',
    );
  }
}
