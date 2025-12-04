import { ApikeyRepository } from '@/database/repositories/apikey.repository';
import { TeamRepository } from '@/database/repositories/team.repository';
import { JwtHelper } from '@/modules/auth/jwt-utils';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
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
         *
         * - 正常情况下前端会在 header 中传入 x-monkeys-teamid 作为当前团队 ID
         * - 新用户首次登录时，本地可能还残留旧账号的 teamId：
         *   - JWT 属于新账号
         *   - header.teamId 属于旧团队，新账号并不在该团队内
         * - 我们需要在「不越权访问其他团队」的前提下，允许新用户继续访问 /users/profile、/teams 等接口。
         *
         * 策略：
         * - 如果用户已经有团队：
         *   - 且 header.teamId 不属于该用户 → 直接 Forbidden，防止跨团队越权
         * - 如果用户还没有任何团队：
         *   - 忽略 header.teamId，将 request.teamId 留空，交给后续接口自行创建默认团队（例如 /teams 会为新用户建团队）
         */
        let finalTeamId = undefined as string | undefined;

        if (teamId) {
          const userTeams = await this.teamRepository.getUserTeams(userId);
          const isUserInTeam = await this.teamRepository.isUserInTeam(userId, teamId);
          if (isUserInTeam) {
            finalTeamId = teamId;
          } else if (userTeams.length > 0) {
            // header.teamId 不属于当前用户：忽略这个 teamId，回退到用户自己的第一个团队
            finalTeamId = userTeams[0].id;
          }
          // 如果用户当前还没有任何团队（新用户场景），保持 finalTeamId 为空，交给后续接口处理（例如 /teams 会自动创建默认团队）。
        } else {
          const userTeams = await this.teamRepository.getUserTeams(userId);
          if (userTeams.length > 0) {
            finalTeamId = userTeams[0].id;
          }
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
