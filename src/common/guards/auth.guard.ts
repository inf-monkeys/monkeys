import { ApikeyRepository } from '@/database/repositories/apikey.repository';
import { TeamRepository } from '@/database/repositories/team.repository';
import { JwtHelper } from '@/modules/auth/jwt-utils';
import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { config } from '../config';
import { IRequest } from '../typings/request';
import { isValidObjectId } from '../utils';

@Injectable()
export class CompatibleAuthGuard implements CanActivate {
  constructor(
    public teamRepository: TeamRepository,
    public apiKeyRepository: ApikeyRepository,
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<IRequest>();

    if (request.skipUnauthorized) {
      return true;
    }

    if (config.auth.enabled?.length > 0) {
      // OIDC
      let isAuthenticated = false;
      let userId: string;
      let teamId: string;
      let apiKey: string;
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
            apiKey = authorizationToken;
          }
        }
        // privileged token
        else if (authorizationToken.startsWith('$') && authorizationToken === config.auth.privilegedToken) {
          const headerUserId = request.headers['x-monkeys-userid'] as string;
          const headerTeamId = request.headers['x-monkeys-teamid'] as string;

          request.teamId = headerTeamId;

          if (!headerTeamId || !isValidObjectId(headerTeamId)) {
            return false;
          }

          if (headerUserId && isValidObjectId(headerUserId)) {
            request.userId = headerUserId;
          } else {
            request.userId = (await this.teamRepository.getUserIdByTeamId(headerTeamId)) as string;
            if (!request.userId) {
              return false;
            }
          }

          const isUserInTeam = await this.teamRepository.isUserInTeam(request.userId, request.teamId);
          if (!isUserInTeam) {
            return false;
          }

          return true;
        }
        // password or phone
        else {
          try {
            const result = JwtHelper.validateToken({
              idToken: authorizationToken,
            });
            userId = result.id;
            isAuthenticated = true;
            teamId = request.headers['x-monkeys-teamid'] as string;
          } catch (error) {}
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
        request.apikey = apiKey;
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
