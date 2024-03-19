import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { config } from '../config';

@Injectable()
export class CompatibleAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext) {
    if (config.auth.enabled?.length > 0) {
      const request = context.switchToHttp().getRequest();
      return request.isAuthenticated();
    } else {
      return true;
    }
  }
}
