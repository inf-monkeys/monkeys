import { JwtHelper } from '@/modules/auth/jwt-utils';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { config } from '../config';
import { IRequest } from '../typings/request';

@Injectable()
export class CompatibleAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext) {
    if (config.auth.enabled?.length > 0) {
      const request: any = context.switchToHttp().getRequest<IRequest>();

      // OIDC 认证方式
      const authenticatedByOidc = request.isAuthenticated();
      if (authenticatedByOidc) {
        return true;
      }

      let authorizationToken = request.headers['authorization'];
      if (authorizationToken) {
        authorizationToken = authorizationToken.replace('Bearer ', '');
        const result = JwtHelper.validateToken({
          idToken: authorizationToken,
        });
        request.userId = result.sub;
        return true;
      }

      // 密码/验证码认证方式
    } else {
      return true;
    }
  }
}
