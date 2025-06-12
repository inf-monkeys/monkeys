import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { OidcGuard } from './oidc.guard';

@Injectable()
export class AdminGuard extends OidcGuard {
  async canActivate(context: ExecutionContext) {
    const result = await super.canActivate(context);
    if (!result) {
      return false;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.isAdmin) {
      throw new UnauthorizedException('You are not an admin');
    }

    return true;
  }
}
