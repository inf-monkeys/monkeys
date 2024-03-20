import { JwtHelper } from '@/modules/auth/jwt-utils';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { config } from '../config';
import { IRequest } from '../typings/request';

@Injectable()
export class CompatibleAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext) {
    const request: any = context.switchToHttp().getRequest<IRequest>();

    if (config.auth.enabled?.length > 0) {
      // OIDC 认证方式
      const authenticatedByOidc = request.isAuthenticated();
      if (authenticatedByOidc) {
        request.userId = request.user.sub;
        return true;
      }

      // 密码/验证码认证方式
      let authorizationToken = request.headers['authorization'];
      if (authorizationToken) {
        authorizationToken = authorizationToken.replace('Bearer ', '');
        const result = JwtHelper.validateToken({
          idToken: authorizationToken,
        });
        request.userId = result.sub;
        return true;
      }

      return false;
    } else {
      request.userId = 'default';
      request.teamId = 'default';
      return true;
    }
  }
}
