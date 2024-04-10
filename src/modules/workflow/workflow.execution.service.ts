import { RATE_LIMITER_TOKEN } from '@/common/common.module';
import { conductorClient } from '@/common/conductor';
import { OrderBy } from '@/common/dto/order.enum';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { TooManyRequestsException } from '@/common/exceptions/too-many-requests';
import { RateLimiter } from '@/common/utils/rate-limiter';
import { sleep } from '@/common/utils/utils';
import { WorkflowMetadataEntity } from '@/database/entities/workflow/workflow-metadata';
import { WorkflowTriggerType } from '@/database/entities/workflow/workflow-trigger';
import { Workflow } from '@inf-monkeys/conductor-javascript';
import { Inject, Injectable } from '@nestjs/common';
import _ from 'lodash';
import retry from 'retry-as-promised';
import { FindWorkflowCondition, WorkflowRepository } from '../../database/repositories/workflow.repository';
import { ConductorService } from './conductor/conductor.service';
import { SearchWorkflowExecutionsDto, SearchWorkflowExecutionsOrderDto, WorkflowExecutionSearchableField } from './dto/req/search-workflow-execution.dto';
import { UpdateTaskStatusDto } from './dto/req/update-task-status.dto';
import { StartWorkflowRequest } from './interfaces';

export interface WorkflowWithMetadata extends Workflow {
  startBy: string;
  triggerType: WorkflowTriggerType;
}

@Injectable()
export class WorkflowExecutionService {
  constructor(
    private readonly workflowRepository: WorkflowRepository,
    private readonly conductorService: ConductorService,
    @Inject(RATE_LIMITER_TOKEN) private readonly rateLimiter: RateLimiter,
  ) {}

  private async populateMetadataByForExecutions(executions: Workflow[]): Promise<WorkflowWithMetadata[]> {
    const workflowInstanceIds = executions.map((x) => x.workflowId);
    const result: WorkflowWithMetadata[] = [];
    if (workflowInstanceIds.length) {
      const executionRecords = await this.workflowRepository.findExecutionsByWorkflowInstanceIds(workflowInstanceIds);
      for (const execution of executions) {
        const executionRecord = executionRecords.find((x) => x.workflowInstanceId === execution.workflowId);
        if (executionRecord) {
          result.push({
            ...execution,
            startBy: executionRecord.userId,
            triggerType: executionRecord.triggerType,
          });
        } else {
          result.push({
            ...execution,
            startBy: undefined,
            triggerType: undefined,
          });
        }
      }
    }
    return result;
  }

  public async searchWorkflowExecutions(
    teamId: string,
    condition: SearchWorkflowExecutionsDto,
  ): Promise<{ page: number; limit: number; total: number; definitions: WorkflowMetadataEntity[]; data: WorkflowWithMetadata[] }> {
    const {
      pagination = {},
      orderBy = {},
      workflowId,
      creatorUserId,
      status = [],
      startTimeFrom,
      startTimeTo,
      freeText = '*',
      startBy = [],
      chatSessionIds = [],
      versions = [],
      triggerTypes = [],
      workflowInstanceId,
    } = condition;
    const { page: p = 1, limit: l = 10 } = pagination as PaginationDto;
    const [page, limit] = [+p, +l];
    const start = (page - 1) * limit;

    const workflowCondition: FindWorkflowCondition = {
      teamId,
    };

    if (workflowId) {
      workflowCondition.workflowId = workflowId;
    }
    if (creatorUserId) {
      workflowCondition.creatorUserId = creatorUserId;
    }

    const workflowsToSearch = await this.workflowRepository.findWorkflowByCondition(workflowCondition);

    if (workflowsToSearch.length === 0) {
      return {
        definitions: [],
        data: [],
        page,
        limit,
        total: 0,
      };
    }
    const workflowTypes = workflowsToSearch.map((x) => x.workflowId).slice(0, 10);
    const query = [];
    query.push(`workflowType IN (${workflowTypes.join(',')})`);
    if (status.length) {
      query.push(`status IN (${status.join(',')})`);
    }
    if (startTimeFrom) {
      query.push(`startTime > ${startTimeFrom}`);
    }
    if (startTimeTo) {
      query.push(`startTime < ${startTimeTo}`);
    }

    if (versions?.length) {
      query.push(`version IN (${versions.join(',')})`);
    }

    const workflowInstanceIdsToSearch: string[][] = [];

    if (workflowInstanceId) {
      workflowInstanceIdsToSearch.push([workflowInstanceId]);
    } else {
      if (startBy?.length) {
        const workflowInstancesStartByThisUser = await this.workflowRepository.findExecutionsByUserIds(startBy);
        const workflowInstanceIdsStartByThisUser = workflowInstancesStartByThisUser.map((x) => x.workflowInstanceId);
        if (workflowInstanceIdsStartByThisUser.length === 0) {
          return {
            definitions: [],
            data: [],
            page,
            limit,
            total: 0,
          };
        }
        workflowInstanceIdsToSearch.push(workflowInstanceIdsStartByThisUser);
      }

      if (chatSessionIds?.length) {
        const workflowInstancesStartByTChatSession = await this.workflowRepository.findExecutionsByChatSessionIds(chatSessionIds);
        const workflowInstanceIdsStartByChatSession = workflowInstancesStartByTChatSession.map((x) => x.workflowInstanceId);
        if (workflowInstanceIdsStartByChatSession.length === 0) {
          return {
            definitions: [],
            data: [],
            page,
            limit,
            total: 0,
          };
        }
        workflowInstanceIdsToSearch.push(workflowInstanceIdsStartByChatSession);
      }

      if (triggerTypes?.length) {
        const workflowInstancesStartByTriggerType = await this.workflowRepository.findExecutionsByTriggerTypes(triggerTypes);
        const workflowInstanceIdsStartByTriggerTypes = workflowInstancesStartByTriggerType.map((x) => x.workflowInstanceId);
        if (workflowInstanceIdsStartByTriggerTypes.length === 0) {
          return {
            definitions: [],
            data: [],
            page,
            limit,
            total: 0,
          };
        }
        workflowInstanceIdsToSearch.push(workflowInstanceIdsStartByTriggerTypes);
      }
    }

    if (workflowInstanceIdsToSearch.length) {
      query.push(`workflowId IN (${workflowInstanceIdsToSearch.slice(0, 10).join(',')})`);
    }

    const { field = WorkflowExecutionSearchableField.startTime, order = OrderBy.DESC } = orderBy as SearchWorkflowExecutionsOrderDto;
    const sortText = `${field}:${order}`;

    const data = await retry(
      async () => {
        const data = await conductorClient.workflowResource.searchV21(start, limit, sortText, freeText, query.join('AND'));
        return data;
      },
      {
        max: 3,
      },
    );

    let definitions: WorkflowMetadataEntity[] = [];
    if (workflowId) {
      const flow = await this.workflowRepository.getWorkflowById(workflowId, 1);
      definitions = [flow];
    } else {
      const workflowIds = _.uniq(data.results.map((r) => r.workflowName));
      if (workflowIds.length > 0) {
        definitions = await this.workflowRepository.findWorkflowByIds(workflowIds);
      }
    }

    const executions = data?.results ?? [];
    const executionsWithMetadata = await this.populateMetadataByForExecutions(executions);
    return {
      definitions,
      page,
      limit,
      total: data?.totalHits ?? 0,
      data: executionsWithMetadata,
    };
  }

  public async getWorkflowExecutionDetail(teamId: string, workflowInstanceId: string) {
    const data = await this.conductorService.getWorkflowExecutionStatus(teamId, workflowInstanceId);
    await this.populateMetadataByForExecutions([data]);
    return data;
  }

  public async startWorkflow(request: StartWorkflowRequest) {
    const { teamId, userId, workflowId, triggerType, chatSessionId, workflowContext } = request;
    let { version } = request;
    if (!version) {
      version = await this.workflowRepository.getMaxVersion(workflowId);
    }
    const workflow = await this.workflowRepository.getWorkflowById(workflowId, version);
    if (workflow.isRateLimitEnabled()) {
      const can = await this.rateLimiter.can(`workflow_execitions:${workflowId}:${version}`, workflow.rateLimiter.windowMs, workflow.rateLimiter.max);
      if (!can) {
        throw new TooManyRequestsException();
      }
    }
    if (!workflow) {
      throw new Error('Workflow not exists');
    }
    let { inputData = {} } = request;
    if (inputData?.__context) {
      throw new Error('inputData 不能包含内置参数 __context');
    }
    inputData = {
      ...inputData,
      __context: {
        userId,
        teamId,
        chatSessionId,
        appId: workflowContext.appId,
        appUrl: workflowContext.appUrl,
      },
    };
    const workflowInstanceId = await conductorClient.workflowResource.startWorkflow({
      name: workflowId,
      version: version,
      input: inputData,
    });
    await this.workflowRepository.saveWorkflowExecution(workflowId, version, workflowInstanceId, userId, triggerType, chatSessionId);
    return workflowInstanceId;
  }

  public async waitForWorkflowResult(teamId: string, workflowInstanceId: string, interval: number = 200, maxWiat: number = 600 * 1000) {
    let finished = false;
    let output;
    const start = +new Date();
    while (!finished) {
      const workflow = await this.getWorkflowExecutionDetail(teamId, workflowInstanceId);
      const status = workflow.status;
      finished = status === 'COMPLETED' || status === 'FAILED' || status === 'TERMINATED' || status === 'TIMED_OUT';
      output = workflow.output;
      await sleep(interval);
      if (+new Date() - start >= maxWiat) {
        break;
      }
    }
    return output;
  }

  public async pauseWorkflow(workflowInstanceId: string) {
    return await conductorClient.workflowResource.pauseWorkflow(workflowInstanceId);
  }

  public async resumeWorkflow(workflowInstanceId: string) {
    return await conductorClient.workflowResource.resumeWorkflow(workflowInstanceId);
  }

  public async terminateWorkflow(workflowInstanceId: string) {
    return await conductorClient.workflowResource.terminate1(workflowInstanceId);
  }

  public async retryWorkflow(workflowInstanceId: string) {
    return conductorClient.workflowResource.retry1(workflowInstanceId);
  }

  public async updateTaskStatus(workflowInstanceId: string, taskId: string, updates: UpdateTaskStatusDto) {
    return await conductorClient.taskResource.updateTask1({
      workflowInstanceId,
      taskId,
      outputData: updates.outputData,
      status: updates.status as 'IN_PROGRESS' | 'FAILED' | 'FAILED_WITH_TERMINAL_ERROR' | 'COMPLETED',
    });
  }
}
