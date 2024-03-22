import { JwtHelper } from '@/modules/auth/jwt-utils';
import { ApikeyRepository } from '@/repositories/apikey.repository';
import { TeamRepository } from '@/repositories/team.repository';
import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { config } from '../config';
import { IRequest } from '../typings/request';

@Injectable()
export class CompatibleAuthGuard implements CanActivate {
  constructor(
    private readonly teamRepository: TeamRepository,
    private readonly apiKeyRepository: ApikeyRepository,
  ) {}

  async canActivate(context: ExecutionContext) {
    const request: any = context.switchToHttp().getRequest<IRequest>();

    if (config.auth.enabled?.length > 0) {
      // OIDC
      let isAuthenticated = false;
      let userId: string;
      let teamId: string;
      const authenticatedByOidc = request.isAuthenticated();
      if (authenticatedByOidc) {
        userId = request.user.sub;
        isAuthenticated = true;
      }

      let authorizationToken = request.headers['authorization'] as string;
      if (authorizationToken) {
        authorizationToken = authorizationToken.replace('Bearer ', '');
        // apikey
        if (authorizationToken.startsWith('sk-')) {
          const validateApiKeyResult = await this.apiKeyRepository.validateApiKey(authorizationToken);
          isAuthenticated = validateApiKeyResult.valid;
          if (isAuthenticated) {
            userId = validateApiKeyResult.userId;
            teamId = validateApiKeyResult.teamId;
          }
        }
        // password or phone
        else {
          const result = JwtHelper.validateToken({
            idToken: authorizationToken,
          });
          userId = result.id;
          isAuthenticated = true;
          teamId = request.headers['x-monkeys-teamid'];
          // if (!teamId) {
          //   throw new ForbiddenException('Header x-monkeys-teamid must be provided');
          // }
        }
      }

      if (isAuthenticated) {
        // Validate team
        if (teamId) {
          const isUserInTeam = await this.teamRepository.isUserInTeam(userId, teamId);
          if (!isUserInTeam) {
            throw new ForbiddenException();
          }
        }
        request.userId = userId;
        request.teamId = teamId;
        return true;
      } else {
        return false;
      }
    } else {
      request.userId = 'default';
      request.teamId = 'default';
      return true;
    }
  }
}
