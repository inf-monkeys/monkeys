import { config } from '@/common/config';
import { IRequest } from '@/common/typings/request';
import { UserRepository } from '@/database/repositories/user.repository';
import { WorkflowRepository } from '@/database/repositories/workflow.repository';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { logger } from '../logger';

type PartialTelemetryPayload = {
  function_group?: string;
  function_name?: string;
  workflow_id?: string;
  workflow_version?: number;
  input_preview?: string;
  workspace_name?: string;
};

@Injectable()
export class TelemetryService implements OnModuleInit {
  private workflowRepository?: WorkflowRepository;

  constructor(
    private readonly userRepository: UserRepository,
    private readonly moduleRef: ModuleRef,
  ) {}

  onModuleInit() {
    const enabled = !!config?.telemetry?.enabled;
    logger.info(`[Telemetry] Telemetry service ${enabled ? 'enabled' : 'disabled'}`);
  }

  private getWorkflowRepository() {
    if (!this.workflowRepository) {
      this.workflowRepository = this.moduleRef.get(WorkflowRepository, { strict: false });
    }
    return this.workflowRepository;
  }

  private extractWorkflowId(url?: string) {
    if (!url) return undefined;
    const execMatch = url.match(/workflow\/executions\/([^/]+)/);
    return execMatch?.[1];
  }

  private parseTelemetryHeader(rawTelemetry?: string | string[]) {
    if (!rawTelemetry) return undefined;
    const telemetryHeader = Array.isArray(rawTelemetry) ? rawTelemetry[0] : rawTelemetry;
    if (!telemetryHeader) return undefined;
    let telemetry: PartialTelemetryPayload | undefined;
    try {
      telemetry = JSON.parse(telemetryHeader) as PartialTelemetryPayload;
    } catch (error) {
      try {
        const decoded = Buffer.from(telemetryHeader, 'base64').toString('utf-8');
        const decodedJson = decodeURIComponent(decoded);
        telemetry = JSON.parse(decodedJson) as PartialTelemetryPayload;
      } catch (err) {
        logger.warn(`[Telemetry] Failed to parse telemetry header: ${(err as Error).message}`);
      }
    }
    return telemetry;
  }

  private safeStringify(data: unknown) {
    try {
      return JSON.stringify(data);
    } catch {
      return undefined;
    }
  }

  public recordWorkflowRun(request: IRequest, rawTelemetry?: string | string[]) {
    if (!config?.telemetry?.enabled) return;

    const telemetry = this.parseTelemetryHeader(rawTelemetry);

    const url = request.originalUrl || request.url;
    const workflowId = telemetry?.workflow_id || this.extractWorkflowId(url);
    const versionFromRequest = Number((request.body as any)?.version);
    const versionFromHeader = telemetry?.workflow_version;
    const workflowVersion = Number.isFinite(versionFromRequest) ? versionFromRequest : versionFromHeader;

    const inputData = ((request.body as any)?.inputData ?? {}) as Record<string, unknown>;
    const userContext = (inputData as any).__context ?? {};
    const userId = userContext?.userId || request.userId;
    const functionGroup = config.telemetry.functionGroup || 'workflow';

    const logOtherinfo = this.safeStringify({
      workflow_version: workflowVersion,
      extra_metadata: {
        base: (request.body as any)?.extraMetadata,
        workspace_name: telemetry?.workspace_name,
      },
    });

    const userInput = this.safeStringify(inputData);

    setImmediate(async () => {
      try {
        let functionName = telemetry?.function_name;
        if (!functionName && workflowId) {
          try {
            const workflowRepository = this.getWorkflowRepository();
            const workflow =
              workflowVersion && Number.isFinite(workflowVersion)
                ? await workflowRepository?.getWorkflowById(workflowId, workflowVersion as number, false)
                : await workflowRepository?.getWorkflowByIdWithoutVersion(workflowId, false);
            functionName = (workflow as any)?.displayName || workflowId;
          } catch {
            functionName = workflowId;
          }
        }

        let userName: string | undefined;
        let userEmail: string | undefined;
        if (userId) {
          const user = await this.userRepository.findById(userId);
          if (user) {
            userName = user.name || user.nickname || undefined;
            userEmail = user.email || undefined;
          }
        }

        const telemetryRecord = {
          App_deployment: config.telemetry.appDeployment,
          App_group: config.telemetry.appGroup,
          App_name: config.telemetry.appName,
          App_ownerteam: config.telemetry.appOwnerTeam,
          Function_group: functionGroup,
          Function_name: functionName || workflowId || 'workflow',
          User_input: userInput,
          Log_otherinfo: logOtherinfo,
          User_id: userId,
          User_name: userName,
          User_email: userEmail,
        };

        // 发送 HTTP 请求到日志服务
        if (config.telemetry.loggingServiceUrl) {
          try {
            const response = await fetch(config.telemetry.loggingServiceUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache',
                'Ocp-Apim-Subscription-Key': config.telemetry.loggingApiKey || '',
              },
              body: JSON.stringify(telemetryRecord),
            });

            if (!response.ok) {
              logger.warn(`[Telemetry] Failed to send telemetry: ${response.status} ${response.statusText}`);
            }
          } catch (error) {
            logger.warn(`[Telemetry] Failed to send telemetry: ${(error as Error).message}`);
          }
        } else {
          // Fallback：如果没有配置服务URL，输出到本地日志
          logger.info(`[Telemetry][workflow] ${JSON.stringify(telemetryRecord)}`);
        }
      } catch (error) {
        logger.warn(`[Telemetry] Failed to log telemetry: ${(error as Error).message}`);
      }
    });
  }
}
