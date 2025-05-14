import { config } from '@/common/config';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class TenantStaticsAuthGuard implements CanActivate {
  constructor() {}
  async canActivate(context: ExecutionContext) {
    // Skip if config.tenantStatics.bearerToken is not configured in config.yaml
    const configToken = config.tenantStatics.bearerToken;
    if (!configToken) {
      return false;
    }

    // Get Bearer Token from request
    const request = context.switchToHttp().getRequest();
    const authorizationToken = request.headers['x-monkeys-tenantstatics'] as string;
    const userToken = authorizationToken.replace('Bearer ', '');

    if (configToken !== userToken) {
      return false;
    }
    return true;
  }
}
