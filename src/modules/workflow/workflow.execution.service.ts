import { RATE_LIMITER_TOKEN } from '@/common/common.module';
import { conductorClient } from '@/common/conductor';
import { config } from '@/common/config';
import { OrderBy } from '@/common/dto/order.enum';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { WorkflowExecutionContext } from '@/common/dto/workflow-execution-context.dto';
import { TooManyRequestsException } from '@/common/exceptions/too-many-requests';
import { logger } from '@/common/logger';
import { extractImageUrls, extractVideoUrls, flattenKeys, getDataType } from '@/common/utils';
import { RateLimiter } from '@/common/utils/rate-limiter';
import { sleep } from '@/common/utils/utils';
import { WorkflowExecutionEntity } from '@/database/entities/workflow/workflow-execution';
import { WorkflowMetadataEntity } from '@/database/entities/workflow/workflow-metadata';
import { WorkflowTriggerType } from '@/database/entities/workflow/workflow-trigger';
import { FindWorkflowCondition, WorkflowRepository } from '@/database/repositories/workflow.repository';
import { Task, Workflow } from '@inf-monkeys/conductor-javascript';
import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import _, { pick } from 'lodash';
import retry from 'retry-as-promised';
import { FindManyOptions, In, IsNull, Not } from 'typeorm';
import { ConductorService } from './conductor/conductor.service';
import { SearchWorkflowExecutionsDto, SearchWorkflowExecutionsOrderDto, WorkflowExecutionSearchableField } from './dto/req/search-workflow-execution.dto';
import { UpdateTaskStatusDto } from './dto/req/update-task-status.dto';
import { DebugWorkflowRequest, StartWorkflowRequest, WorkflowExecutionOutput } from './interfaces';
import { WorkflowObservabilityService } from './workflow.observability.service';
import { WorkflowTrackerService } from './workflow.tracker.service';

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
    private readonly eventEmitter: EventEmitter2,
    @Inject(forwardRef(() => WorkflowTrackerService))
    private readonly workflowTrackerService: WorkflowTrackerService,
    private readonly workflowObservabilityService: WorkflowObservabilityService,
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
    let groups = condition.groups || [];

    const { page: p = 1, limit: l = 10 } = pagination as PaginationDto;
    const [page, limitNum] = [+p, +l];
    const start = (page - 1) * limitNum;

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

    const shortcutIds = workflowsToSearch.map((it) => (it.shortcutsFlow ? `shortcut-${it.workflowId}` : null)).filter(Boolean);
    if (shortcutIds.length) {
      groups = groups.concat(shortcutIds);
    }

    if (workflowsToSearch.length === 0 && !workflowInstanceId) {
      return {
        definitions: [],
        data: [],
        page,
        limit: limitNum,
        total: 0,
      };
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

    let workflowInstanceIdsToFilter: string[][] = [];

    const hasGroups = groups.length > 0;
    const shortcutOriginalWorkflows = new Map<string, WorkflowMetadataEntity>();

    if (workflowInstanceId) {
      query = [`workflowId IN (${workflowInstanceId})`];
      workflowInstanceIdsToFilter = [];
    } else {
      const hasChatSessions = (chatSessionIds?.length ?? 0) > 0;
      if (hasChatSessions) {
        const instancesFromChat = await this.workflowRepository.findExecutionsByChatSessionIds(chatSessionIds);
        const ids = instancesFromChat.map((x) => x.workflowInstanceId);
        if (ids.length === 0) return { definitions: [], data: [], page, limit: limitNum, total: 0 };
        workflowInstanceIdsToFilter.push(ids);
      }

      if (hasGroups) {
        const instancesFromGroup = await this.workflowRepository.findExecutionsByGroups(groups);
        const ids = instancesFromGroup.map((x) => x.workflowInstanceId);
        if (ids.length === 0) return { definitions: [], data: [], page, limit: limitNum, total: 0 };

        const groupWorkflowDefIds = _.uniq(instancesFromGroup.map((entity) => entity.workflowId).filter(Boolean));
        for (const wf of await this.workflowRepository.findWorkflowByIds(groupWorkflowDefIds)) {
          if (!shortcutOriginalWorkflows.has(wf.workflowId)) {
            shortcutOriginalWorkflows.set(wf.workflowId, wf);
          }
        }
        workflowInstanceIdsToFilter.push(ids);
        query = query.filter((q) => !q.startsWith('workflowType IN'));
      }

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
        if (intersection.length === 0 && !workflowInstanceId) {
          return { definitions: [], data: [], page, limit: limitNum, total: 0 };
        }
        if (intersection.length > 0) {
          query.push(`workflowId IN (${intersection.slice(0, 500).join(',')})`);
        }
      }
    }

    const { field = WorkflowExecutionSearchableField.startTime, order = OrderBy.DESC } = orderBy as SearchWorkflowExecutionsOrderDto;
    const sortText = `${field}:${order}`;

    const conductorQueryString = query.join(' AND ') || undefined;
    logger.info(`Conductor search query: ${conductorQueryString}, freeText: ${freeText}, sort: ${sortText}`);

    const searchData = await retry(() => conductorClient.workflowResource.searchV21(start, limitNum, sortText, freeText, conductorQueryString), {
      max: 3,
    });

    let resultDefinitions: WorkflowMetadataEntity[] = [];
    const resultWorkflowDefIds = _.uniq(searchData.results.map((r) => r.workflowName));
    if (resultWorkflowDefIds.length > 0) {
      resultDefinitions = await this.workflowRepository.findWorkflowByIds(resultWorkflowDefIds);
    } else if (workflowId && !workflowInstanceId) {
      const flow = await this.workflowRepository.getWorkflowById(workflowId, 1);
      if (flow) resultDefinitions = [flow];
    }

    const executionsResult = searchData?.results ?? [];
    for (const executionItem of executionsResult) {
      this.conductorService.convertConductorTasksToVinesTasks(teamId, (executionItem.tasks || []) as Task[], executionItem.workflowDefinition);
    }

    const executionsWithMetadata = await this.populateMetadataByForExecutions(executionsResult);

    let filterCount = 0;
    const finalData = executionsWithMetadata.filter((it) => {
      if (!hasGroups) {
        if ((it.input?.['__context']?.['group']?.toString() as string)?.startsWith('shortcut')) {
          filterCount++;
          return false;
        }
      }
      return true;
    });

    return {
      definitions: resultDefinitions.map((it) => {
        if (it.shortcutsFlow) {
          const shortcutFlowId = it.shortcutsFlow.toString()?.split(':')?.[0];
          if (shortcutFlowId) {
            const originalWorkflow = shortcutOriginalWorkflows.get(shortcutFlowId);
            if (originalWorkflow) {
              return {
                ...it,
                ...pick(originalWorkflow, [
                  'workflowId',
                  'tasks',
                  'version',
                  'updatedTimestamp',
                  'iconUrl',
                  'displayName',
                  'description',
                  'variables',
                  'output',
                  'md5',
                  'exposeOpenaiCompatibleInterface',
                  'openaiModelName',
                ]),
              } as WorkflowMetadataEntity;
            }
          }
        }
        return it;
      }),
      page,
      limit: limitNum,
      data: finalData,
      total: (searchData?.totalHits ?? 0) - filterCount,
    };
  }

  public async getWorkflowExecutionDetail(teamId: string, workflowInstanceId: string) {
    const data = await this.conductorService.getWorkflowExecutionStatus(teamId, workflowInstanceId);
    const populatedDataArray = await this.populateMetadataByForExecutions([data]);
    return populatedDataArray[0] || data;
  }

  public async getWorkflowExecutionSimpleDetail(teamId: string, workflowInstanceId: string): Promise<WorkflowExecutionOutput> {
    const conductorWorkflow = await this.conductorService.getWorkflowExecutionStatus(teamId, workflowInstanceId);
    const populatedResults = await this.populateMetadataByForExecutions([conductorWorkflow]);
    const executionData: WorkflowWithMetadata = populatedResults[0];

    const { input, output } = executionData;
    const ctx = input?.['__context'];
    const startByUserId = executionData.startBy || ctx?.userId;

    let alt: string | string[] | undefined;
    const flattenOutput = flattenKeys(output, void 0, ['__display_text'], (_, dataVal) => {
      alt = dataVal;
    });

    const outputKeys = Object.keys(flattenOutput);
    const outputValues = Object.values(flattenOutput);
    const finalOutput = [];
    let isInserted = false;

    // 为每个 key-value 对单独处理
    for (let i = 0; i < outputKeys.length; i++) {
      const key = outputKeys[i];
      const value = outputValues[i];

      // 提取图片和视频
      const images = extractImageUrls(value);
      const videos = extractVideoUrls(value);

      // 处理图片
      for (const image of images) {
        finalOutput.push({
          type: 'image',
          data: image,
          alt,
          key: key, // 添加对应的 key
        });
        isInserted = true;
      }

      // 处理视频
      for (const video of videos) {
        finalOutput.push({
          type: 'video',
          data: video,
          key: key, // 添加对应的 key
        });
        isInserted = true;
      }

      // 如果没有图片和视频，处理文本或 JSON
      if (images.length === 0 && videos.length === 0) {
        if (typeof value === 'string') {
          finalOutput.push({
            type: 'text',
            data: value,
            key: key, // 添加对应的 key
          });
        } else {
          finalOutput.push({
            type: 'json',
            data: value,
            key: key, // 添加对应的 key
          });
        }
        isInserted = true;
      }
    }

    // 如果没有插入任何内容，添加原始输出
    if (!isInserted && output) {
      finalOutput.push({
        type: 'json',
        data: output,
        key: 'root', // 或者使用其他标识
      });
    }

    let formattedInput = null;
    const definitions = await this.workflowRepository.findWorkflowByIds([executionData.workflowName]);

    if (definitions.length > 0) {
      const { variables } = definitions[0];
      if (variables && input) {
        formattedInput = Object.keys(input)
          .filter((inputName) => !inputName.startsWith('__'))
          .map((inputName) => {
            const value = input[inputName];
            const variable = variables.find((variable) => variable.name === inputName);
            return {
              id: inputName,
              displayName: variable?.displayName || inputName,
              description: variable?.description || '',
              data: value,
              type: getDataType(value),
            };
          });
      }
    }

    return {
      ..._.pick(executionData, ['status', 'createTime', 'startTime', 'updateTime', 'endTime']),
      input: formattedInput,
      rawInput: input,
      output: finalOutput,
      rawOutput: output,
      workflowId: executionData.workflowName,
      instanceId: executionData.workflowId,
      userId: startByUserId,
      teamId: ctx?.teamId || teamId,
    } as WorkflowExecutionOutput;
  }

  public async getAllWorkflowsExecutionOutputs(
    teamId: string,
    condition = {
      page: 1,
      limit: 10,
      orderBy: 'DESC' as 'DESC' | 'ASC',
      orderKey: 'conductorStartTime' as string,
    },
  ): Promise<{
    total: number;
    data: WorkflowExecutionOutput[];
    page: number;
    limit: number;
    workflows: Pick<WorkflowMetadataEntity, 'displayName' | 'description' | 'workflowId' | 'iconUrl'>[];
  }> {
    const { page, limit: limitNum, orderBy, orderKey } = condition;

    const workflowDefinitions = await this.workflowRepository.getAllWorkflows(teamId);
    if (workflowDefinitions.length === 0) {
      return {
        total: 0,
        data: [],
        page,
        limit: limitNum,
        workflows: [],
      };
    }
    const workflowIdsForTeam = workflowDefinitions.map((w) => w.workflowId);
    const workflowDefinitionMap = _.keyBy(workflowDefinitions, 'workflowId');

    const orderByField = orderKey || 'conductorStartTime';
    const orderDirection = orderBy === 'DESC' ? 'DESC' : 'ASC';

    const [executions, total] = await this.workflowRepository.findAndCountWorkflowExecutions({
      where: {
        workflowId: In(workflowIdsForTeam),
        isDeleted: false,
        conductorStartTime: Not(IsNull()),
      },
      order: { [orderByField]: orderDirection },
      skip: (page - 1) * limitNum,
      take: limitNum,
    } as FindManyOptions<WorkflowExecutionEntity>);

    const formattedExecutions = executions.map((entity) => {
      const {
        input,
        output,
        workflowId: entityWorkflowId,
        workflowInstanceId,
        status,
        conductorCreateTime,
        conductorStartTime,
        conductorUpdateTime,
        conductorEndTime,
        userId: entityUserId,
        createdTimestamp,
        updatedTimestamp,
      } = entity;

      const workflowDef = workflowDefinitionMap[entityWorkflowId];
      const contextTeamId = input?.['__context']?.teamId || teamId;

      let alt: string | string[] | undefined;
      const flattenOutput = flattenKeys(output, undefined, ['__display_text'], (_, dataVal) => {
        alt = dataVal;
      });
      const outputKeys = Object.keys(flattenOutput);
      const outputValues = Object.values(flattenOutput);
      const finalOutput = [];
      let isInserted = false;

      // 为每个 key-value 对单独处理
      for (let i = 0; i < outputKeys.length; i++) {
        const key = outputKeys[i];
        const value = outputValues[i];

        // 提取图片和视频
        const images = extractImageUrls(value);
        const videos = extractVideoUrls(value);

        // 处理图片
        for (const image of images) {
          finalOutput.push({
            type: 'image',
            data: image,
            alt,
            key: key, // 添加对应的 key
          });
          isInserted = true;
        }

        // 处理视频
        for (const video of videos) {
          finalOutput.push({
            type: 'video',
            data: video,
            key: key, // 添加对应的 key
          });
          isInserted = true;
        }

        // 如果没有图片和视频，处理文本或 JSON
        if (images.length === 0 && videos.length === 0) {
          if (typeof value === 'string') {
            finalOutput.push({
              type: 'text',
              data: value,
              key: key, // 添加对应的 key
            });
          } else {
            finalOutput.push({
              type: 'json',
              data: value,
              key: key, // 添加对应的 key
            });
          }
          isInserted = true;
        }
      }

      // 如果没有插入任何内容，添加原始输出
      if (!isInserted && output) {
        finalOutput.push({
          type: 'json',
          data: output,
          key: 'root', // 或者使用其他标识
        });
      }

      let formattedInputArray = null;
      if (workflowDef?.variables && input) {
        formattedInputArray = Object.keys(input)
          .filter((inputName) => !inputName.startsWith('__'))
          .map((inputName) => {
            const dataVal = input[inputName];
            const variableDef = workflowDef.variables.find((v) => v.name === inputName);
            return {
              id: inputName,
              displayName: variableDef?.displayName || inputName,
              description: variableDef?.description || '',
              data: dataVal,
              type: getDataType(dataVal),
            };
          });
      }

      return {
        status: status as any,
        startTime: conductorStartTime || createdTimestamp,
        createTime: conductorCreateTime || createdTimestamp,
        updateTime: conductorUpdateTime || updatedTimestamp,
        endTime: conductorEndTime,
        workflowId: entityWorkflowId,
        output: finalOutput,
        rawOutput: output,
        input: formattedInputArray,
        rawInput: input,
        instanceId: workflowInstanceId,
        userId: entityUserId,
        teamId: contextTeamId,
      } as WorkflowExecutionOutput;
    });

    return {
      total,
      data: formattedExecutions,
      page,
      limit: limitNum,
      workflows: workflowDefinitions.map((workflow) => pick(workflow, ['displayName', 'description', 'workflowId', 'iconUrl'])),
    };
  }

  public async getWorkflowExecutionOutputs(inputWorkflowId: string, page = 1, limit = 10) {
    let workflow = await this.workflowRepository.getWorkflowByIdWithoutVersion(inputWorkflowId);

    let shortcutsFlowInstanceIds: string[] = [];
    const isShortcutFlow = workflow?.shortcutsFlow !== null && workflow?.shortcutsFlow !== undefined;
    if (isShortcutFlow) {
      const convertedWorkflow = await this.workflowRepository.convertWorkflowWhitShortcutsFlowId(workflow);
      if (convertedWorkflow) {
        workflow = convertedWorkflow;
        shortcutsFlowInstanceIds = _.uniq((await this.workflowRepository.findExecutionsByGroups([`shortcut-${inputWorkflowId}`])).map((it) => it.workflowInstanceId));
      }
    }

    const start = (page - 1) * limit;
    const conductorWorkflowFilter = shortcutsFlowInstanceIds.length > 0 ? shortcutsFlowInstanceIds.join(',') : inputWorkflowId;
    const query = `workflowType IN (${conductorWorkflowFilter})`;

    const data = await retry(() => conductorClient.workflowResource.searchV21(start, limit, 'startTime:DESC', '*', query), {
      max: 3,
    });

    return {
      total: data?.totalHits ?? 0,
      data: (data?.results ?? [])
        .filter((it) => (!isShortcutFlow ? !(it.input?.['__context']?.['group']?.toString() as string)?.startsWith('shortcut') : true))
        .map((it) => {
          const { workflowId: execWorkflowId, input, output, ...rest } = pick(it, ['status', 'startTime', 'createTime', 'updateTime', 'endTime', 'workflowId', 'output', 'input']);

          let alt: string | string[] | undefined;
          const flattenOutput = flattenKeys(output, void 0, ['__display_text'], (_, dataVal) => {
            alt = dataVal;
          });

          const outputKeys = Object.keys(flattenOutput);
          const outputValues = Object.values(flattenOutput);
          const finalOutput = [];
          let isInserted = false;

          // 为每个 key-value 对单独处理
          for (let i = 0; i < outputKeys.length; i++) {
            const key = outputKeys[i];
            const currentKey = key.split('.')[key.split('.').length - 1];
            const value = outputValues[i];

            // __ 开头的 key 不处理
            if (currentKey.startsWith('__')) {
              continue;
            }

            // 提取图片和视频
            const images = extractImageUrls(value);
            const videos = extractVideoUrls(value);

            // 处理图片
            for (const image of images) {
              finalOutput.push({
                type: 'image',
                data: image,
                alt,
                key: key,
              });
              isInserted = true;
            }

            // 处理视频
            for (const video of videos) {
              finalOutput.push({
                type: 'video',
                data: video,
                key: key,
              });
              isInserted = true;
            }

            // 如果没有图片和视频，处理文本或 JSON
            if (images.length === 0 && videos.length === 0) {
              if (typeof value === 'string') {
                finalOutput.push({
                  type: 'text',
                  data: value,
                  key: key, // 添加对应的 key
                });
              } else {
                finalOutput.push({
                  type: 'json',
                  data: value,
                  key: key, // 添加对应的 key
                });
              }
              isInserted = true;
            }
          }

          // 如果没有插入任何内容，添加原始输出
          if (!isInserted && output) {
            finalOutput.push({
              type: 'json',
              data: output,
              key: 'root', // 或者使用其他标识
            });
          }

          const ctx = input?.['__context'];

          let formattedInput = null;

          const variables = workflow.variables;
          if (variables && input) {
            formattedInput = Object.keys(input)
              .filter((inputName) => !inputName.startsWith('__'))
              .map((inputName) => {
                const dataVal = input[inputName];
                const variable = variables.find((variable) => variable.name === inputName);
                return {
                  id: inputName,
                  displayName: variable?.displayName || inputName,
                  description: variable?.description || '',
                  data: dataVal,
                  type: getDataType(dataVal),
                };
              });
          }

          return {
            ...rest,
            input: formattedInput,
            rawInput: input,
            output: finalOutput,
            rawOutput: output,
            workflowId: inputWorkflowId,
            instanceId: execWorkflowId,
            userId: ctx?.userId ?? '',
            teamId: ctx?.teamId ?? '',
          } as WorkflowExecutionOutput;
        }),
      page,
      limit,
    };
  }

  public async deleteWorkflowExecution(teamId: string, workflowInstanceId: string) {
    await this.conductorService.getWorkflowExecutionStatus(teamId, workflowInstanceId);
    return await this.conductorService.deleteWorkflowExecution(workflowInstanceId);
  }

  public async startWorkflow(request: StartWorkflowRequest) {
    const { teamId, userId, triggerType, chatSessionId, apiKey, group } = request;
    const workflowContext: WorkflowExecutionContext = {
      userId,
      teamId: teamId,
      appId: config.server.appId,
    };
    let { version, workflowId } = request;
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

    const extra: Partial<Pick<WorkflowExecutionEntity, 'chatSessionId' | 'group'>> = {};
    if (chatSessionId) {
      extra['chatSessionId'] = chatSessionId;
    }
    if (group) {
      extra['group'] = group;
    }

    const originalWorkflowIdForShortcut = workflow.workflowId;

    const convertedWorkflow = await this.workflowRepository.convertWorkflowWhitShortcutsFlowId(workflow, version, true);
    if (convertedWorkflow) {
      extra['group'] = `shortcut-${originalWorkflowIdForShortcut}`;
      workflowId = convertedWorkflow.workflowId;
      version = convertedWorkflow.version;
    }

    inputData = {
      ...inputData,
      __context: {
        userId,
        teamId,
        appId: workflowContext.appId,
        ...extra,
      },
    };
    const workflowInstanceId = await conductorClient.workflowResource.startWorkflow({
      name: workflowId,
      version: version,
      input: inputData,
    });

    // 注册回调
    await this.workflowTrackerService.registerWorkflowTracking({
      workflowInstanceId,
      workflowId,
      teamId,
    });
    this.eventEmitter.on(`workflow.completed.${workflowInstanceId}`, async (result: { workflowInstanceId: string; result: Workflow; timestamp: number }) => {
      const observabilityFactories = await this.workflowObservabilityService.getWorkflowObservabilityInstanceList(teamId, workflowId);
      if (observabilityFactories.length) {
        logger.info(`${workflowInstanceId} completed, start to notify observability factories`);
        for (const factory of observabilityFactories) {
          await factory(result.result);
        }
      }
    });

    await this.workflowRepository.saveWorkflowExecution({
      workflowId,
      version,
      workflowInstanceId,
      userId,
      triggerType,
      apiKey,
      ...(extra.chatSessionId && { chatSessionId: extra.chatSessionId }),
      ...(extra.group && { group: extra.group }),
    });
    return workflowInstanceId;
  }

  public async debugWorkflow(request: DebugWorkflowRequest) {
    const { teamId, userId, workflowId, tasks, output = [] } = request;

    await this.conductorService.saveWorkflowInConductor({
      workflowId,
      description: 'Temporary debugging workflow',
      version: -1,
      tasks,
      output,
      teamId,
    });

    let { inputData } = request;

    if (inputData?.__context) {
      throw new Error('inputData 不能包含内置参数 __context');
    }
    inputData = {
      ...inputData,
      __context: {
        userId,
        teamId,
        appId: config.server.appId,
      },
    };

    return conductorClient.workflowResource.startWorkflow({
      name: workflowId,
      version: -1,
      input: inputData,
    });
  }

  public async waitForWorkflowResult(teamId: string, workflowInstanceId: string, interval: number = 200, maxWait: number = 600 * 1000) {
    let finished = false;
    let output: Record<string, any>;
    const start = +new Date();
    let status;
    let takes = 0;
    while (!finished) {
      const workflowExecutionDetails = await this.getWorkflowExecutionDetail(teamId, workflowInstanceId);
      status = workflowExecutionDetails.status;
      finished = status === 'COMPLETED' || status === 'FAILED' || status === 'TERMINATED' || status === 'TIMED_OUT';
      output = workflowExecutionDetails.output;
      takes = workflowExecutionDetails.endTime ? workflowExecutionDetails.endTime - (workflowExecutionDetails.startTime || 0) : 0;
      await sleep(interval);
      if (+new Date() - start >= maxWait) {
        break;
      }
    }
    await this.workflowRepository.updateWorkflowExecutionStatus(workflowInstanceId, status, takes);
    return output;
  }

  public async pauseWorkflow(workflowInstanceId: string) {
    return conductorClient.workflowResource.pauseWorkflow(workflowInstanceId);
  }

  public async resumeWorkflow(workflowInstanceId: string) {
    return conductorClient.workflowResource.resumeWorkflow(workflowInstanceId);
  }

  public async terminateWorkflow(workflowInstanceId: string) {
    return conductorClient.workflowResource.terminate1(workflowInstanceId);
  }

  public async retryWorkflow(workflowInstanceId: string) {
    return conductorClient.workflowResource.retry1(workflowInstanceId);
  }

  public async updateTaskStatus(workflowInstanceId: string, taskId: string, updates: UpdateTaskStatusDto) {
    return conductorClient.taskResource.updateTask1({
      workflowInstanceId,
      taskId,
      outputData: updates.outputData,
      status: updates.status as 'IN_PROGRESS' | 'FAILED' | 'FAILED_WITH_TERMINAL_ERROR' | 'COMPLETED',
    });
  }

  public async getWorkflowExecutionThumbnails(workflowId: string, limit = 5) {
    const data = await retry(
      async () => {
        return conductorClient.workflowResource.searchV21(0, 100, 'startTime:DESC', '*', `workflowType IN (${workflowId}) AND status IN (COMPLETED)`);
      },
      {
        max: 3,
      },
    );

    let count = 0;
    let thumbnails: string[] = [];
    for (const execution of data.results) {
      const flattenOutput = flattenKeys(execution.output);
      const outputValues = Object.values(flattenOutput);
      const images = outputValues.map((it) => extractImageUrls(it)).flat();
      const imagesLength = images.length;
      if (imagesLength) {
        thumbnails = thumbnails.concat(images);
        count += imagesLength;
      }

      if (count >= limit) {
        break;
      }
    }
    return thumbnails.slice(0, limit);
  }

  public async getWorkflowInstanceByImageUrl(teamId: string, workflowId: string, imageUrl: string, page = 1, limit = 500) {
    const start = (page - 1) * limit;

    const data = await retry(() => conductorClient.workflowResource.searchV21(start, limit, 'startTime:DESC', '*', `workflowType IN (${workflowId}) AND status IN (COMPLETED)`), {
      max: 3,
    });

    for (const execution of data.results) {
      const flattenOutput = flattenKeys(execution.output);
      const outputValues = Object.values(flattenOutput);
      if (outputValues.some((it) => extractImageUrls(it).includes(imageUrl))) {
        const { workflowId: execWorkflowId, input: execInput, ...rest } = pick(execution, ['status', 'startTime', 'createTime', 'updateTime', 'endTime', 'workflowId', 'output', 'input']);
        return {
          instance: {
            ...rest,
            input: execInput,
            instanceId: execWorkflowId,
            userId: execInput?.__context?.userId ?? null,
            teamId: execInput?.__context?.teamId ?? teamId,
          },
          total: data.totalHits,
        };
      }
    }

    return {
      instance: null,
      total: 0,
    };
  }
}
