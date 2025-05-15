import { config } from '@/common/config';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class TenantStatisticsAuthGuard implements CanActivate {
  constructor() {}
  async canActivate(context: ExecutionContext) {
    // Skip if config.tenant.bearer is not configured in config.yaml
    const configToken = config.tenant.bearer;
    if (!configToken) {
      throw new Error('Tenant Bearer Token Not Configured');
    }

    // Get Bearer Token from request
    const request = context.switchToHttp().getRequest();
    const authorizationToken = request.headers['authorization'] as string | undefined;

    const userToken = authorizationToken?.replace('Bearer ', '');

    if (configToken !== userToken) {
      return false;
    }

    return true;
  }
}
