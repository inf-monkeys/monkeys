import { conductorClient } from '@/common/conductor';
import { config } from '@/common/config';
import { OrderBy } from '@/common/dto/order.enum';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { WorkflowStatusEnum } from '@/common/dto/status.enum';
import { extractImageUrls, flattenKeys, flattenObject, getDataType } from '@/common/utils';
import { WorkflowExecutionEntity } from '@/database/entities/workflow/workflow-execution';
import { WorkflowMetadataEntity } from '@/database/entities/workflow/workflow-metadata';
import { FindWorkflowCondition, WorkflowRepository } from '@/database/repositories/workflow.repository';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import _, { isBoolean } from 'lodash';
import { Brackets, Repository } from 'typeorm';
import { ConductorService } from '../workflow/conductor/conductor.service';
import { SearchWorkflowExecutionsDto, SearchWorkflowExecutionsOrderDto, WorkflowExecutionSearchableField } from '../workflow/dto/req/search-workflow-execution.dto';
import { WorkflowExecutionService } from '../workflow/workflow.execution.service';
import { Execution, Input, Output } from './tenant.types';

@Injectable()
export class TenantService {
  constructor(
    @InjectRepository(WorkflowExecutionEntity)
    private readonly workflowExecutionRepository: Repository<WorkflowExecutionEntity>,
    private readonly workflowRepository: WorkflowRepository,
    private readonly conductorService: ConductorService,
    private readonly workflowExecutionService: WorkflowExecutionService,
  ) {}

  /**
   * output 字段处理逻辑，完全复用 workflow.execution.service.ts
   */
  private formatOutput(rawOutput: any): Output[] {
    let alt: string | string[] | undefined;
    const flattenOutput = flattenKeys(rawOutput, undefined, ['__display_text'], (_, dataVal) => {
      alt = dataVal;
    });
    const outputKeys = Object.keys(flattenOutput);
    const outputValues = Object.values(flattenOutput);
    const finalOutput: Output[] = [];
    let isInserted = false;
    for (let i = 0; i < outputKeys.length; i++) {
      const key = outputKeys[i];
      const value = outputValues[i];
      const images = extractImageUrls(value);
      // 只保留图片类型
      for (const image of images) {
        finalOutput.push({
          type: 'image',
          data: image,
          key: key,
        });
        isInserted = true;
      }
    }
    return finalOutput;
  }

  /**
   * input 字段处理逻辑，完全复用 workflow.execution.service.ts
   */
  private formatInput(input: any, workflowDef?: any): Input[] {
    if (!workflowDef?.variables || !input) return [];
    return Object.keys(input)
      .filter((inputName) => !inputName.startsWith('__'))
      .map((inputName) => {
        const dataVal = input[inputName];
        const variableDef = workflowDef.variables.find((v: any) => v.name === inputName);
        let displayName = variableDef?.displayName || inputName;
        const flag = variableDef?.flag === true;
        let finalData = dataVal;
        if (flag) {
          let displayNameStr = displayName;
          if (typeof displayName === 'object' && displayName !== null) {
            const firstLang = Object.keys(displayName)[0];
            displayNameStr = displayName[firstLang] || inputName;
          }
          finalData = `${displayNameStr}${dataVal}`;
        }
        // type 只允许 'string' | 'number' | 'boolean' | 'file'
        let type: 'string' | 'number' | 'boolean' | 'file' = 'string';
        const t = getDataType(dataVal);
        if (t === 'number' || t === 'boolean') {
          type = t;
        } else if (variableDef?.type === 'file') {
          type = 'file';
        }
        return {
          data: finalData,
          displayName: displayName,
          type: type,
          flag: flag,
        };
      });
  }

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

  async getAllExecutions(options: { page: number; limit: number; extraMetadata?: Record<string, any> | Record<string, any>[] }) {
    const { page, limit, extraMetadata } = options;
    const qb = this.workflowExecutionRepository.createQueryBuilder('execution')
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('execution.created_timestamp', 'DESC');

    if (extraMetadata && Object.keys(extraMetadata).length > 0) {
      qb.andWhere(new Brackets(qb1 => {
        if (Array.isArray(extraMetadata)) {
          // 支持数组查询（IN 查询）
          Object.entries(extraMetadata[0] || {}).forEach(([key, value]) => {
            if (Array.isArray(value)) {
              qb1.andWhere(`execution.extra_metadata->>:key IN (:...values)`, { key, values: value });
            } else {
              qb1.andWhere(`execution.extra_metadata->>:key = :value`, { key, value });
            }
          });
        } else {
          // 原有的对象查询
          Object.entries(extraMetadata).forEach(([key, value]) => {
            if (Array.isArray(value)) {
              qb1.andWhere(`execution.extra_metadata->>:key IN (:...values)`, { key, values: value });
            } else {
              qb1.andWhere(`execution.extra_metadata->>:key = :value`, { key, value });
            }
          });
        }
      }));
    }

    const [rawData, total] = await qb.getManyAndCount();
    // 获取 workflow 定义用于处理 input
    const workflowIds = [...new Set(rawData.map(item => item.workflowId))];
    const workflowDefinitions = await this.workflowRepository.findWorkflowByIds(workflowIds);
    const workflowDefMap = new Map(workflowDefinitions.map(wf => [wf.workflowId, wf]));

    // 处理数据，转换为新的结构
    const data: Execution[] = rawData.map(execution => {
      const workflowDef = workflowDefMap.get(execution.workflowId);
      return {
        workflowId: execution.workflowId,
        workflowInstanceId: execution.workflowInstanceId,
        input: this.formatInput(execution.input, workflowDef),
        rawInput: execution.input,
        output: this.formatOutput(execution.output),
        rawOutput: execution.output,
        extraMetadata: execution.extraMetadata,
        searchableText: '', // 如有需要可补充
      };
    });
    return { data, total };
  }

  public async searchWorkflowExecutionsForTeam(
    teamId: string,
    condition: SearchWorkflowExecutionsDto,
  ): Promise<{ page: number; limit: number; total: number; data: Execution[]; definitions: WorkflowMetadataEntity[] }> {
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
    // 获取 workflow 定义用于处理 input
    const workflowIds = [...new Set(executionsResult.map(item => item.workflowId))];
    const workflowDefinitions = await this.workflowRepository.findWorkflowByIds(workflowIds);
    const workflowDefMap = new Map(workflowDefinitions.map(wf => [wf.workflowId, wf]));
    // 处理数据，转换为新的结构
    const data: Execution[] = executionsResult.map(execution => {
      const workflowDef = workflowDefMap.get(execution.workflowId);
      // 只取需要的字段，避免访问不存在的属性
      const workflowInstanceId = execution['workflowInstanceId'] || execution['instanceId'] || '';
      const extraMetadata = execution['extraMetadata'];
      return {
        workflowId: execution.workflowId,
        workflowInstanceId,
        input: this.formatInput(execution.input, workflowDef),
        rawInput: execution.input,
        output: this.formatOutput(execution.output),
        rawOutput: execution.output,
        extraMetadata,
        searchableText: '', // 如有需要可补充
      };
    });
    return { definitions: workflowsToSearch, data, page, limit: limitNum, total: searchData?.totalHits ?? 0 };
  }
}
