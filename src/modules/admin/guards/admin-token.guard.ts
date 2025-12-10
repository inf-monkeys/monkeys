import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { config } from '@/common/config';

/**
 * Admin Init Token 守卫
 * 验证请求头中的 X-Init-Token 是否与配置中的 initToken 匹配
 * 用于保护 SuperAdmin 初始化接口
 */
@Injectable()
export class AdminTokenGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const initToken = request.headers['x-init-token'];

    const configToken = config.admin?.initToken;

    if (!configToken || initToken !== configToken) {
      throw new UnauthorizedException('Invalid init token');
    }

    return true;
  }
}
