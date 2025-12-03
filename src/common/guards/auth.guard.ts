import { ApikeyRepository } from '@/database/repositories/apikey.repository';
import { TeamRepository } from '@/database/repositories/team.repository';
import { JwtHelper } from '@/modules/auth/jwt-utils';
import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { config } from '../config';
import { TelemetryService } from '../services/telemetry.service';
import { IRequest } from '../typings/request';
import { isValidObjectId } from '../utils';

@Injectable()
export class CompatibleAuthGuard implements CanActivate {
  constructor(
    public teamRepository: TeamRepository,
    public apiKeyRepository: ApikeyRepository,
    private readonly telemetryService: TelemetryService,
  ) {}

  private shouldRecordTelemetry(request: IRequest) {
    const path = request.path || request.url || '';
    const method = (request.method || '').toUpperCase();
    if (method !== 'POST') return false;
    return /\/workflow\/executions\/[^/]+\/(start|debug)/.test(path);
  }

  private recordTelemetry(request: IRequest) {
    if (!this.shouldRecordTelemetry(request)) return;
    this.telemetryService.recordWorkflowRun(request, request.headers['x-monkeys-telemetry'] as string | string[]);
  }

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<IRequest>();

    if (request.skipUnauthorized) {
      this.recordTelemetry(request);
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
        /**
         * teamId 兜底逻辑说明：
         * - 正常情况下前端会在 header 中传入 x-monkeys-teamid 作为当前团队 ID
         * - 当用户使用一个全新的账号登录，但浏览器还保留了旧账号的 teamId 时，会出现：
         *   - JWT 属于新账号
         *   - header.teamId 属于旧团队，新账号并不在该团队内 → isUserInTeam = false
         *   - 旧逻辑直接抛 ForbiddenException，导致新账号无法访问任何资源
         *
         * 改进策略：
         * - 当发现「用户已认证但 header.teamId 不属于该用户」时：
         *   - 优先回退到「用户自己的第一个团队」作为当前 teamId
         *   - 若用户一个团队都没有，则仍抛 ForbiddenException
         * - 这样可以兼容新账号首次登录场景，同时仍保证不会越权访问其他团队数据
         */
        let finalTeamId = teamId;
        if (teamId) {
          const isUserInTeam = await this.teamRepository.isUserInTeam(userId, teamId);
          if (!isUserInTeam) {
            const userTeams = await this.teamRepository.getUserTeams(userId);
            if (!userTeams.length) {
              throw new ForbiddenException();
            }
            finalTeamId = userTeams[0].id;
          }
        } else {
          const userTeams = await this.teamRepository.getUserTeams(userId);
          if (!userTeams.length) {
            throw new ForbiddenException();
          }
          finalTeamId = userTeams[0].id;
        }

        request.userId = userId;
        request.teamId = finalTeamId;
        request.apikey = apiKey;
        this.recordTelemetry(request);
        return true;
      } else {
        return false;
      }
    } else {
      request.userId = 'default';
      request.teamId = 'default';
      this.recordTelemetry(request);
      return true;
    }
  }
}
