import { conductorClient } from '@/common/conductor';
import { config } from '@/common/config';
import { OrderBy } from '@/common/dto/order.enum';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { WorkflowStatusEnum } from '@/common/dto/status.enum';
import { flattenObject } from '@/common/utils';
import { WorkflowExecutionEntity } from '@/database/entities/workflow/workflow-execution';
import { WorkflowMetadataEntity } from '@/database/entities/workflow/workflow-metadata';
import { FindWorkflowCondition, WorkflowRepository } from '@/database/repositories/workflow.repository';
import { Task } from '@inf-monkeys/conductor-javascript';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import _, { isBoolean } from 'lodash';
import { Brackets, Repository } from 'typeorm';
import { ConductorService } from '../workflow/conductor/conductor.service';
import { SearchWorkflowExecutionsDto, SearchWorkflowExecutionsOrderDto, WorkflowExecutionSearchableField } from '../workflow/dto/req/search-workflow-execution.dto';
import { WorkflowExecutionService, WorkflowWithMetadata } from '../workflow/workflow.execution.service';

@Injectable()
export class TenantService {
  constructor(
    @InjectRepository(WorkflowExecutionEntity)
    private readonly workflowExecutionRepository: Repository<WorkflowExecutionEntity>,
    private readonly workflowRepository: WorkflowRepository,
    private readonly conductorService: ConductorService,
    private readonly workflowExecutionService: WorkflowExecutionService,
  ) {}

  async findAll() {
    const totalExecutions = await this.workflowExecutionRepository.find();

    return {
      workflow: {
        execution: {
          // 从数据库拿到的是所有的统计
          total: {
            count: totalExecutions.length,
            success: totalExecutions.filter((e) => e.status === WorkflowStatusEnum.COMPLETED).length,
            failed: totalExecutions.filter((e) => e.status === WorkflowStatusEnum.FAILED).length,
          },
        },
      },
    };
  }

  async getAllExecutions(options: { page: number; limit: number; extraMetadata?: Record<string, any> }) {
    const { page, limit, extraMetadata } = options;
    const qb = this.workflowExecutionRepository.createQueryBuilder('execution')
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('execution.created_timestamp', 'DESC');

    if (extraMetadata && Object.keys(extraMetadata).length > 0) {
      qb.andWhere(new Brackets(qb1 => {
        Object.entries(extraMetadata).forEach(([key, value]) => {
          qb1.andWhere(`execution.extra_metadata->>:key = :value`, { key, value });
        });
      }));
    }

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async findBetween(startTime: number, endTime: number) {
    const { results: rawCurrentExecutions } = await conductorClient.workflowResource.searchV21(undefined, undefined, undefined, undefined, `startTime > ${startTime} AND startTime < ${endTime}`);
    const currentExecutions = rawCurrentExecutions.filter((e) => e.input?.__context?.appId === config.server.appId && e.startTime >= startTime && e.endTime <= endTime);

    const imageSuffix = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
    const output = {
      image: currentExecutions
        .map((e) => Object.values(flattenObject(e.output)))
        .flat()
        .filter((value: string | number | null) => typeof value === 'string' && imageSuffix.some((suffix) => value.endsWith(suffix))).length,
    };
    return {
      workflow: {
        execution: {
          // 用户没有删除的（只有没有删除的可以查到输入输出内容）
          current: {
            count: currentExecutions.length,
            success: currentExecutions.filter((e) => e.status === WorkflowStatusEnum.COMPLETED).length,
            resultSuccess: currentExecutions.filter((e) => e.output && (isBoolean(e.output.success) ? e.output.success : true)).length,
            failed: currentExecutions.filter((e) => e.status === WorkflowStatusEnum.FAILED).length,
            output,
          },
        },
      },
    };
  }

  public async searchWorkflowExecutionsForTeam(
    teamId: string,
    condition: SearchWorkflowExecutionsDto,
  ): Promise<{ page: number; limit: number; total: number; data: WorkflowWithMetadata[]; definitions: WorkflowMetadataEntity[] }> {
    const { pagination = {}, orderBy = {}, workflowId, status = [], startTimeFrom, startTimeTo, freeText = '*', startBy = [], triggerTypes = [], versions = [], workflowInstanceId } = condition;

    const { page: p = 1, limit: l = 10 } = pagination as PaginationDto;
    const [page, limitNum] = [+p, +l];
    const start = (page - 1) * limitNum;

    const workflowCondition: FindWorkflowCondition = { teamId };
    if (workflowId) {
      workflowCondition.workflowId = workflowId;
    }
    const workflowsToSearch = await this.workflowRepository.findWorkflowByCondition(workflowCondition);

    if (workflowsToSearch.length === 0 && !workflowInstanceId) {
      return { definitions: [], data: [], page, limit: limitNum, total: 0 };
    }

    const workflowTypes = workflowsToSearch.map((x) => x.workflowId);
    let query: string[] = [];
    if (workflowTypes.length > 0) {
      query.push(`workflowType IN (${workflowTypes.join(',')})`);
    }

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

    const workflowInstanceIdsToFilter: string[][] = [];

    if (workflowInstanceId) {
      query = [`workflowId IN (${workflowInstanceId})`];
    } else {
      if (startBy?.length) {
        const instancesFromUser = await this.workflowRepository.findExecutionsByUserIds(startBy);
        const ids = instancesFromUser.map((x) => x.workflowInstanceId);
        if (ids.length === 0) return { definitions: [], data: [], page, limit: limitNum, total: 0 };
        workflowInstanceIdsToFilter.push(ids);
      }

      if (triggerTypes?.length) {
        const instancesFromTrigger = await this.workflowRepository.findExecutionsByTriggerTypes(triggerTypes);
        const ids = instancesFromTrigger.map((x) => x.workflowInstanceId);
        if (ids.length === 0) return { definitions: [], data: [], page, limit: limitNum, total: 0 };
        workflowInstanceIdsToFilter.push(ids);
      }

      if (workflowInstanceIdsToFilter.length > 0) {
        const intersection = _.intersection(...workflowInstanceIdsToFilter);
        if (intersection.length === 0) {
          return { definitions: [], data: [], page, limit: limitNum, total: 0 };
        }
        query.push(`workflowId IN (${intersection.slice(0, 500).join(',')})`);
      }
    }

    const { field = WorkflowExecutionSearchableField.startTime, order = OrderBy.DESC } = orderBy as SearchWorkflowExecutionsOrderDto;
    const sortText = `${field}:${order}`;

    const conductorQueryString = query.join(' AND ') || undefined;

    const searchData = await conductorClient.workflowResource.searchV21(start, limitNum, sortText, freeText, conductorQueryString);

    const executionsResult = searchData?.results ?? [];
    for (const executionItem of executionsResult) {
      this.conductorService.convertConductorTasksToVinesTasks(teamId, (executionItem.tasks || []) as Task[], executionItem.workflowDefinition);
    }

    const executionsWithMetadata = await this.workflowExecutionService['populateMetadataByForExecutions'](executionsResult);

    return {
      definitions: workflowsToSearch,
      page,
      limit: limitNum,
      data: executionsWithMetadata,
      total: searchData?.totalHits ?? 0,
    };
  }
}
