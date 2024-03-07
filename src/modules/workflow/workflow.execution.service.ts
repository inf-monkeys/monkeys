import { conductorClient } from '@/common/conductor';
import { OrderBy } from '@/common/dto/order.enum';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { WorkflowMetadataEntity } from '@/entities/workflow/workflow';
import { WorkflowTriggerType } from '@/entities/workflow/workflow-trigger';
import { Workflow } from '@io-orkes/conductor-javascript';
import { Injectable } from '@nestjs/common';
import _ from 'lodash';
import retry from 'retry-as-promised';
import { WorkflowRepository } from '../infra/database/repositories/workflow.repository';
import { SearchWorkflowExecutionsDto, SearchWorkflowExecutionsOrderDto, WorkflowExecutionSearchableField } from './dto/req/search-workflow-execution.dto';

export interface WorkflowWithMetadata extends Workflow {
  startBy: string;
  triggerType: WorkflowTriggerType;
}

@Injectable()
export class WorkflowExecutionService {
  constructor(private readonly workflowRepository: WorkflowRepository) {}

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

    const workflowCondition: Partial<WorkflowMetadataEntity> = {
      teamId,
    };

    if (workflowId) {
      workflowCondition.workflowId = workflowId;
    }
    if (creatorUserId) {
      workflowCondition.creatorUserId = creatorUserId;
    }

    const workflowsToSearch = await this.workflowRepository.findByCondition(workflowCondition);

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
}
