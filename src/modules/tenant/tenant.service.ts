import { conductorClient } from '@/common/conductor';
import { config } from '@/common/config';
import { OrderBy } from '@/common/dto/order.enum';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { WorkflowStatusEnum } from '@/common/dto/status.enum';
import { extractImageUrls, flattenKeys, flattenObject, flattenObjectToSearchableText, getDataType } from '@/common/utils';
import { WorkflowExecutionEntity } from '@/database/entities/workflow/workflow-execution';
import { WorkflowMetadataEntity } from '@/database/entities/workflow/workflow-metadata';
import { FindWorkflowCondition, WorkflowRepository } from '@/database/repositories/workflow.repository';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import _, { isBoolean, omit } from 'lodash';
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
    if (!rawOutput) return [];

    const flattenOutput = flattenKeys(rawOutput, undefined, ['__display_text']);
    const outputKeys = Object.keys(flattenOutput);
    const outputValues = Object.values(flattenOutput);
    const finalOutput: Output[] = [];

    for (let i = 0; i < outputKeys.length; i++) {
      const key = outputKeys[i];
      const value = outputValues[i];

      // 跳过 __ 开头的内部字段
      if (key.startsWith('__')) continue;

      const images = extractImageUrls(value);

      // 处理图片类型
      for (const image of images) {
        finalOutput.push({
          type: 'image',
          data: image,
          key: key,
        });
      }

      // 如果没有图片，处理其他类型
      if (images.length === 0 && value !== null && value !== undefined) {
        if (typeof value === 'string') {
          finalOutput.push({
            type: 'text',
            data: value,
            key: key,
          });
        } else {
          finalOutput.push({
            type: 'json',
            data: JSON.stringify(value),
            key: key,
          });
        }
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
      .filter((inputName) => !inputName.startsWith('__') && inputName !== 'extraMetadata')
      .map((inputName) => {
        const dataVal = input[inputName];
        const variableDef = workflowDef.variables.find((v: any) => v.name === inputName);
        const displayName = variableDef?.displayName || inputName;
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

  async getAllExecutions(options: {
    page: number;
    limit: number;
    extraMetadata?: Record<string, any> | Record<string, any>[];
    workflowWithExtraMetadata?: boolean;
    freeText?: string;
    status?: string[];
    startTimeFrom?: number;
    startTimeTo?: number;
    workflowId?: string;
    workflowInstanceId?: string;
    versions?: number[];
    time?: number;
  }) {
    const { page, limit, extraMetadata, workflowWithExtraMetadata, freeText = '*', status = [], startTimeFrom, startTimeTo, workflowId, workflowInstanceId, time } = options;

    const qb = this.workflowExecutionRepository.createQueryBuilder('execution');

    // 添加分页
    qb.skip((page - 1) * limit).take(limit);

    // 添加排序
    qb.orderBy('execution.created_timestamp', 'DESC');

    // 添加 extraMetadata 查询过滤
    if (extraMetadata && Object.keys(extraMetadata).length > 0) {
      if (Array.isArray(extraMetadata)) {
        // 多组条件"或"查询
        qb.andWhere(
          new Brackets((qbOr) => {
            extraMetadata.forEach((group, groupIdx) => {
              qbOr.orWhere(
                new Brackets((qbAnd) => {
                  let paramIdx = 0;
                  Object.entries(group).forEach(([key, value]) => {
                    paramIdx++;
                    if (Array.isArray(value)) {
                      if (value.length === 0) {
                        // 空数组的情况：查询该字段为空数组或不存在
                        const keyParam = `key_${groupIdx}_${paramIdx}`;
                        const emptyArrayParam = `emptyArray_${groupIdx}_${paramIdx}`;
                        qbAnd.andWhere(
                          new Brackets((qb2) => {
                            qb2
                              .orWhere(`execution.extra_metadata->:${keyParam} = :${emptyArrayParam}`, { [keyParam]: key, [emptyArrayParam]: JSON.stringify([]) })
                              .orWhere(`execution.extra_metadata->>:${keyParam} IS NULL`, { [keyParam]: key });
                          }),
                        );
                      } else {
                        value.forEach((v, vIdx) => {
                          const keyParam = `key_${groupIdx}_${paramIdx}_${vIdx}`;
                          const valParam = `val_${groupIdx}_${paramIdx}_${vIdx}`;
                          const valStrParam = `valStr_${groupIdx}_${paramIdx}_${vIdx}`;
                          qbAnd.andWhere(
                            new Brackets((qb2) => {
                              qb2
                                .orWhere(`execution.extra_metadata->:${keyParam} @> :${valParam}`, { [keyParam]: key, [valParam]: JSON.stringify([v]) })
                                .orWhere(`execution.extra_metadata->>:${keyParam} = :${valStrParam}`, { [keyParam]: key, [valStrParam]: v });
                            }),
                          );
                        });
                      }
                    } else {
                      const keyParam = `key_${groupIdx}_${paramIdx}`;
                      const valueParam = `value_${groupIdx}_${paramIdx}`;
                      qbAnd.andWhere(`execution.extra_metadata->>:${keyParam} = :${valueParam}`, { [keyParam]: key, [valueParam]: value });
                    }
                  });
                }),
              );
            });
          }),
        );
      } else {
        // 原有的对象查询
        let paramIdx = 0;
        Object.entries(extraMetadata).forEach(([key, value]) => {
          paramIdx++;
          if (Array.isArray(value)) {
            if (value.length === 0) {
              // 空数组的情况：查询该字段为空数组或不存在
              const keyParam = `key_obj_${paramIdx}`;
              const emptyArrayParam = `emptyArray_obj_${paramIdx}`;
              qb.andWhere(
                new Brackets((qb2) => {
                  qb2
                    .orWhere(`execution.extra_metadata->:${keyParam} = :${emptyArrayParam}`, { [keyParam]: key, [emptyArrayParam]: JSON.stringify([]) })
                    .orWhere(`execution.extra_metadata->>:${keyParam} IS NULL`, { [keyParam]: key });
                }),
              );
            } else {
              value.forEach((v, vIdx) => {
                const keyParam = `key_obj_${paramIdx}_${vIdx}`;
                const valParam = `val_obj_${paramIdx}_${vIdx}`;
                const valStrParam = `valStr_obj_${paramIdx}_${vIdx}`;
                qb.andWhere(
                  new Brackets((qb2) => {
                    qb2
                      .orWhere(`execution.extra_metadata->:${keyParam} @> :${valParam}`, { [keyParam]: key, [valParam]: JSON.stringify([v]) })
                      .orWhere(`execution.extra_metadata->>:${keyParam} = :${valStrParam}`, { [keyParam]: key, [valStrParam]: v });
                  }),
                );
              });
            }
          } else {
            const keyParam = `key_obj_${paramIdx}`;
            const valueParam = `value_obj_${paramIdx}`;
            qb.andWhere(`execution.extra_metadata->>:${keyParam} = :${valueParam}`, { [keyParam]: key, [valueParam]: value });
          }
        });
      }
    }

    // 添加其他查询条件
    if (workflowWithExtraMetadata) {
      qb.andWhere('execution.extra_metadata IS NOT NULL');
      qb.andWhere("execution.extra_metadata != '{}'");
    }

    if (freeText && freeText !== '*') {
      qb.andWhere('execution.searchable_text ILIKE :freeText', { freeText: `%${freeText}%` });
    }

    if (status && status.length > 0) {
      qb.andWhere('execution.status IN (:...status)', { status });
    }

    if (time) {
      const timeFromMillis = Date.now() - time * 24 * 60 * 60 * 1000;
      const timeFromDate = new Date(timeFromMillis);
      qb.andWhere('execution.created_timestamp >= :timeFromDate', { timeFromDate });
    } else {
      if (startTimeFrom) {
        qb.andWhere('execution.created_timestamp >= :startTimeFrom', { startTimeFrom });
      }

      if (startTimeTo) {
        qb.andWhere('execution.created_timestamp <= :startTimeTo', { startTimeTo });
      }
    }

    if (workflowId) {
      qb.andWhere('execution.workflow_id = :workflowId', { workflowId });
    }

    if (workflowInstanceId) {
      qb.andWhere('execution.workflow_instance_id = :workflowInstanceId', { workflowInstanceId });
    }

    const [rawData, total] = await qb.getManyAndCount();

    return {
      data: rawData,
      total,
    };
  }

  public async searchWorkflowExecutionsForTeam(
    teamId: string,
    condition: SearchWorkflowExecutionsDto & { extraMetadata?: Record<string, any> | Record<string, any>[]; workflowWithExtraMetadata?: boolean },
  ): Promise<{ page: number; limit: number; total: number; data: Execution[]; definitions: WorkflowMetadataEntity[] }> {
    const {
      pagination = {},
      orderBy = {},
      workflowId,
      status = [],
      startTimeFrom,
      startTimeTo,
      freeText = '*',
      startBy = [],
      triggerTypes = [],
      versions = [],
      workflowInstanceId,
      extraMetadata,
      workflowWithExtraMetadata,
      time,
    } = condition;
    const { page: p = 1, limit: l = 10 } = pagination as PaginationDto;
    const [page, limitNum] = [+p, +l];

    // 获取团队下的 workflow 定义
    const workflowCondition: FindWorkflowCondition = { teamId };
    if (workflowId) {
      workflowCondition.workflowId = workflowId;
    }
    const workflowsToSearch = await this.workflowRepository.findWorkflowByCondition(workflowCondition);
    if (workflowsToSearch.length === 0 && !workflowInstanceId) {
      return { definitions: [], data: [], page, limit: limitNum, total: 0 };
    }
    const workflowTypes = workflowsToSearch.map((x) => x.workflowId);

    // 构建数据库查询
    const qb = this.workflowExecutionRepository
      .createQueryBuilder('execution')
      .skip((page - 1) * limitNum)
      .take(limitNum);

    // 添加 workflow 类型过滤
    if (workflowTypes.length > 0) {
      qb.andWhere('execution.workflow_id IN (:...workflowTypes)', { workflowTypes });
    }

    // 添加状态过滤
    if (status.length > 0) {
      qb.andWhere('execution.status IN (:...status)', { status });
    }

    // 添加时间范围过滤
    if (time) {
      const timeFromMillis = Date.now() - time * 24 * 60 * 60 * 1000;
      const timeFromDate = new Date(timeFromMillis);
      qb.andWhere('execution.created_timestamp >= :timeFromDate', { timeFromDate });
    } else {
      if (startTimeFrom) {
        qb.andWhere('execution.created_timestamp >= :startTimeFrom', { startTimeFrom });
      }
      if (startTimeTo) {
        qb.andWhere('execution.created_timestamp <= :startTimeTo', { startTimeTo });
      }
    }

    // 添加版本过滤
    if (versions?.length) {
      qb.andWhere('execution.version IN (:...versions)', { versions });
    }

    // 添加特定实例过滤
    if (workflowInstanceId) {
      qb.andWhere('execution.workflow_instance_id = :workflowInstanceId', { workflowInstanceId });
    } else {
      // 处理用户和触发器类型过滤
      const workflowInstanceIdsToFilter: string[][] = [];

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
        qb.andWhere('execution.workflow_instance_id IN (:...instanceIds)', { instanceIds: intersection.slice(0, 500) });
      }
    }

    // 添加自由文本搜索（如果不是默认的 '*'）
    if (freeText !== '*' && freeText.trim()) {
      qb.andWhere(
        new Brackets((qb1) => {
          qb1
            .orWhere('execution.searchable_text ILIKE :freeText', { freeText: `%${freeText}%` })
            .orWhere('execution.workflow_id ILIKE :freeText', { freeText: `%${freeText}%` })
            .orWhere('execution.workflow_instance_id ILIKE :freeText', { freeText: `%${freeText}%` });
        }),
      );
    }

    // 添加 extraMetadata 查询过滤
    if (extraMetadata && Object.keys(extraMetadata).length > 0) {
      if (Array.isArray(extraMetadata)) {
        // 多组条件“或”查询
        qb.andWhere(
          new Brackets((qbOr) => {
            extraMetadata.forEach((group) => {
              qbOr.orWhere(
                new Brackets((qbAnd) => {
                  Object.entries(group).forEach(([key, value]) => {
                    if (Array.isArray(value)) {
                      if (value.length === 0) {
                        // 空数组的情况：查询该字段为空数组或不存在
                        qbAnd.andWhere(
                          new Brackets((qb2) => {
                            qb2.orWhere(`execution.extra_metadata->:key = :emptyArray`, { key, emptyArray: JSON.stringify([]) }).orWhere(`execution.extra_metadata->>:key IS NULL`, { key });
                          }),
                        );
                      } else {
                        value.forEach((v) => {
                          qbAnd.andWhere(
                            new Brackets((qb2) => {
                              qb2.orWhere(`execution.extra_metadata->:key @> :val`, { key, val: JSON.stringify([v]) }).orWhere(`execution.extra_metadata->>:key = :valStr`, { key, valStr: v });
                            }),
                          );
                        });
                      }
                    } else {
                      qbAnd.andWhere(`execution.extra_metadata->>:key = :value`, { key, value });
                    }
                  });
                }),
              );
            });
          }),
        );
      } else {
        // 原有的对象查询
        qb.andWhere(
          new Brackets((qb1) => {
            Object.entries(extraMetadata).forEach(([key, value]) => {
              if (Array.isArray(value)) {
                if (value.length === 0) {
                  // 空数组的情况：查询该字段为空数组或不存在
                  qb1.andWhere(
                    new Brackets((qb2) => {
                      qb2.orWhere(`execution.extra_metadata->:key = :emptyArray`, { key, emptyArray: JSON.stringify([]) }).orWhere(`execution.extra_metadata->>:key IS NULL`, { key });
                    }),
                  );
                } else {
                  value.forEach((v) => {
                    qb1.andWhere(
                      new Brackets((qb2) => {
                        qb2.orWhere(`execution.extra_metadata->:key @> :val`, { key, val: JSON.stringify([v]) }).orWhere(`execution.extra_metadata->>:key = :valStr`, { key, valStr: v });
                      }),
                    );
                  });
                }
              } else {
                qb1.andWhere(`execution.extra_metadata->>:key = :value`, { key, value });
              }
            });
          }),
        );
      }
    }

    // 如果指定了 workflowWithExtraMetadata，则只返回包含 extraMetadata 数据的记录
    if (workflowWithExtraMetadata) {
      qb.andWhere(`execution.extra_metadata IS NOT NULL AND execution.extra_metadata != '{}' AND execution.extra_metadata != 'null'`);
    }

    // 添加排序
    const { field = WorkflowExecutionSearchableField.startTime, order = OrderBy.DESC } = orderBy as SearchWorkflowExecutionsOrderDto;
    let orderByField = 'execution.created_timestamp';
    if (field === WorkflowExecutionSearchableField.startTime) {
      orderByField = 'execution.created_timestamp';
    } else if (field === WorkflowExecutionSearchableField.endTime) {
      orderByField = 'execution.updated_timestamp';
    }
    qb.orderBy(orderByField, order);
    const [rawData, total] = await qb.getManyAndCount();

    // 获取 workflow 定义用于处理 input
    const workflowIds = [...new Set(rawData.map((item) => item.workflowId))];
    const workflowDefinitions = await this.workflowRepository.findWorkflowByIds(workflowIds);
    const workflowDefMap = new Map(workflowDefinitions.map((wf) => [wf.workflowId, wf]));

    // 处理数据，转换为新的结构
    const data: Execution[] = rawData.map((execution) => {
      const workflowDef = workflowDefMap.get(execution.workflowId);

      // 重新生成 searchableText，排除 extraMetadata
      const inputForSearch = execution.input ? omit(execution.input, ['__context', 'extraMetadata']) : null;
      const outputForSearch = execution.output || null;
      const searchableText = `${flattenObjectToSearchableText(inputForSearch)} ${flattenObjectToSearchableText(outputForSearch)}`.trim();

      return {
        status: execution.status,
        workflowId: execution.workflowId,
        workflowInstanceId: execution.workflowInstanceId,
        input: this.formatInput(execution.input, workflowDef),
        rawInput: execution.input,
        output: this.formatOutput(execution.output),
        rawOutput: execution.output,
        extraMetadata: execution.extraMetadata,
        searchableText,
        createTime: execution.createdTimestamp,
      };
    });

    return { definitions: workflowsToSearch, data, page, limit: limitNum, total };
  }
}
