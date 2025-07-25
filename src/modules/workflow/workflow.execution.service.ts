import { RATE_LIMITER_TOKEN } from '@/common/common.module';
import { conductorClient } from '@/common/conductor';
import { config } from '@/common/config';
import { OrderBy } from '@/common/dto/order.enum';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { WorkflowExecutionContext } from '@/common/dto/workflow-execution-context.dto';
import { TooManyRequestsException } from '@/common/exceptions/too-many-requests';
import { logger } from '@/common/logger';
import { extractImageUrls, extractVideoUrls, flattenKeys, flattenObjectToSearchableText, getDataType } from '@/common/utils';
import { convertOutputFromRawOutput } from '@/common/utils/output';
import { RateLimiter } from '@/common/utils/rate-limiter';
import { sleep } from '@/common/utils/utils';
import { WorkflowExecutionEntity } from '@/database/entities/workflow/workflow-execution';
import { WorkflowMetadataEntity } from '@/database/entities/workflow/workflow-metadata';
import { WorkflowTriggerType } from '@/database/entities/workflow/workflow-trigger';
import { FindWorkflowCondition, WorkflowRepository } from '@/database/repositories/workflow.repository';
import { Task, Workflow } from '@inf-monkeys/conductor-javascript';
import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import _, { pick } from 'lodash';
import retry from 'retry-as-promised';
import { FindManyOptions, In, IsNull, Not, Repository } from 'typeorm';
import { ConductorService } from './conductor/conductor.service';
import { SearchWorkflowExecutionsDto, SearchWorkflowExecutionsOrderDto, WorkflowExecutionSearchableField } from './dto/req/search-workflow-execution.dto';
import { UpdateTaskStatusDto } from './dto/req/update-task-status.dto';
import { DebugWorkflowRequest, StartWorkflowRequest, WorkflowExecutionOutput, WorkflowExecutionOutputExtra } from './interfaces';
import { WorkflowObservabilityService } from './workflow.observability.service';
import { WorkflowTrackerService } from './workflow.tracker.service';

// 辅助函数：从input中提取提示词
function extractPromptFromFormattedInput(formattedInput: any[]): string {
  if (!formattedInput || !Array.isArray(formattedInput)) {
    return '';
  }

  // 查找displayName包含"提示词"或"prompt"的字段
  const promptField = formattedInput.find((field) => {
    const displayName = field.displayName;
    if (typeof displayName === 'string') {
      return displayName.includes('提示词') || displayName.toLowerCase().includes('prompt');
    }
    if (typeof displayName === 'object' && displayName !== null) {
      const zhName = displayName['zh-CN'] || '';
      const enName = displayName['en-US'] || '';
      return zhName.includes('提示词') || enName.toLowerCase().includes('prompt');
    }
    return false;
  });

  // 直接返回提示词内容，不做长度限制
  if (promptField && promptField.data) {
    const promptText = promptField.data;
    if (typeof promptText === 'string') {
      return promptText.trim();
    }
    // 如果不是字符串，转换为字符串
    return String(promptText).trim();
  }

  return '';
}

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
    @InjectRepository(WorkflowExecutionEntity)
    private readonly workflowExecutionRepository: Repository<WorkflowExecutionEntity>,
  ) {}

  private async populateMetadataByForExecutions(executions: Workflow[]): Promise<WorkflowWithMetadata[]> {
    const workflowInstanceIds = executions.map((x) => x.workflowId);
    const result: WorkflowWithMetadata[] = [];
    if (workflowInstanceIds.length) {
      const executionRecords = await this.workflowRepository.findExecutionsByWorkflowInstanceIds(workflowInstanceIds);
      for (const execution of executions) {
        const executionRecord = executionRecords.find((x) => x.workflowInstanceId === execution.workflowId);
        // 过滤掉临时工作流的执行记录
        if (executionRecord && executionRecord.isTemporary) {
          continue;
        }
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

    let allResults: any[] = [];
    let totalHits = 0;
    const batchSize = 10;
    let needBatch = false;
    if (workflowTypes.length > batchSize) {
      needBatch = true;
    }
    if (needBatch) {
      // 分批查
      for (let i = 0; i < workflowTypes.length; i += batchSize) {
        const batch = workflowTypes.slice(i, i + batchSize);
        const batchQueryArr = query.filter((q) => !q.startsWith('workflowType IN'));
        batchQueryArr.push(`workflowType IN (${batch.join(',')})`);
        const batchQuery = batchQueryArr.join(' AND ');
        // logger.debug(`Conductor batch search query: ${batchQuery}, freeText: ${freeText}, sort: ${sortText}`);
        const searchData = await retry(() => conductorClient.workflowResource.searchV21(start, limitNum, sortText, freeText, batchQuery), { max: 3 });
        allResults = allResults.concat(searchData.results ?? []);
        totalHits += searchData.totalHits ?? 0;
      }
    } else {
      // 原有逻辑
      const conductorQueryString = query.join(' AND ') || undefined;
      // logger.debug(`Conductor search query: ${conductorQueryString}, freeText: ${freeText}, sort: ${sortText}`);
      const searchData = await retry(() => conductorClient.workflowResource.searchV21(start, limitNum, sortText, freeText, conductorQueryString), { max: 3 });
      allResults = searchData.results ?? [];
      totalHits = searchData.totalHits ?? 0;
    }

    let resultDefinitions: WorkflowMetadataEntity[] = [];
    const resultWorkflowDefIds = _.uniq(allResults.map((r) => r.workflowName));
    if (resultWorkflowDefIds.length > 0) {
      resultDefinitions = await this.workflowRepository.findWorkflowByIds(resultWorkflowDefIds);
    } else if (workflowId && !workflowInstanceId) {
      const flow = await this.workflowRepository.getWorkflowById(workflowId, 1);
      if (flow) resultDefinitions = [flow];
    }

    for (const executionItem of allResults) {
      this.conductorService.convertConductorTasksToVinesTasks(teamId, (executionItem.tasks || []) as Task[], executionItem.workflowDefinition);
    }

    const executionsWithMetadata = await this.populateMetadataByForExecutions(allResults);

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

    // 分页处理
    const pagedData = finalData.slice(0, limitNum);

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
      data: pagedData,
      total: (totalHits ?? 0) - filterCount,
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
    }

    // 如果没有图片和视频，处理文本或 JSON
    if (!isInserted && output) {
      if (typeof output === 'string') {
        finalOutput.push({
          type: 'text',
          data: output,
          key: 'root',
        });
      } else {
        finalOutput.push({
          type: 'json',
          data: output,
          key: 'root',
        });
      }
      isInserted = true;
    }

    let formattedInput = null;
    const definitions = await this.workflowRepository.findWorkflowByIds([executionData.workflowName]);

    if (definitions.length > 0) {
      const { variables } = definitions[0];
      if (variables && input) {
        formattedInput = Object.keys(input)
          .filter((inputName) => !inputName.startsWith('__') && inputName !== 'extraMetadata')
          .map((inputName) => {
            const value = input[inputName];
            const variable = variables.find((variable) => variable.name === inputName);
            return {
              id: inputName,
              displayName: variable?.displayName || inputName,
              description: variable?.description || '',
              data: value,
              type: getDataType(value),
              flag: variable?.flag || false,
            };
          });
      }
    }

    // 从输入数据中提取 extraMetadata
    let extraMetadata = input?.extraMetadata;
    if (typeof extraMetadata === 'string' && extraMetadata !== '') {
      try {
        extraMetadata = JSON.parse(Buffer.from(extraMetadata, 'base64').toString('utf-8'));
      } catch (e) {
        // 如果解析失败，保持原始值
        logger.warn('Failed to parse extraMetadata from base64', e);
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
      extraMetadata,
    } as WorkflowExecutionOutput;
  }
  public async getWorkflowExecutionSimpleDetailFromDb(workflowInstanceId: string): Promise<WorkflowExecutionOutputExtra> {
    const executionData = await this.workflowExecutionRepository.findOne({
      where: {
        workflowInstanceId,
      },
    });

    const { input, output } = executionData;
    const ctx = input?.['__context'];
    const startByUserId = executionData.userId || ctx?.userId;

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
    }

    // 如果没有图片和视频，处理文本或 JSON
    if (!isInserted && output) {
      if (typeof output === 'string') {
        finalOutput.push({
          type: 'text',
          data: output,
          key: 'root',
        });
      } else {
        finalOutput.push({
          type: 'json',
          data: output,
          key: 'root',
        });
      }
      isInserted = true;
    }

    let formattedInput = null;
    const definitions = await this.workflowRepository.findWorkflowByIds([executionData.workflowId]);

    if (definitions.length > 0) {
      const { variables } = definitions[0];
      if (variables && input) {
        formattedInput = Object.keys(input)
          .filter((inputName) => !inputName.startsWith('__') && inputName !== 'extraMetadata')
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

    // 从输入数据中提取 extraMetadata
    let extraMetadata = input?.extraMetadata;
    if (typeof extraMetadata === 'string' && extraMetadata !== '') {
      try {
        extraMetadata = JSON.parse(Buffer.from(extraMetadata, 'base64').toString('utf-8'));
      } catch (e) {
        // 如果解析失败，保持原始值
        logger.warn('Failed to parse extraMetadata from base64', e);
      }
    }

    return {
      ..._.pick(executionData, ['status', 'createTime', 'startTime', 'updateTime', 'endTime']),
      input: formattedInput,
      rawInput: input,
      output: finalOutput,
      rawOutput: output,
      workflowId: executionData.workflowId,
      instanceId: executionData.workflowInstanceId,
      userId: startByUserId,
      extraMetadata,
      version: executionData.workflowVersion,
    } as WorkflowExecutionOutputExtra;
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
        isTemporary: false,
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
        extraMetadata,
        searchableText,
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
      }

      if (!isInserted && output) {
        if (typeof output === 'string') {
          finalOutput.push({
            type: 'text',
            data: output,
            key: 'root',
          });
          isInserted = true;
        } else {
          finalOutput.push({
            type: 'json',
            data: output,
            key: 'root',
          });
        }
        isInserted = true;
      }

      let formattedInputArray = null;
      if (workflowDef?.variables && input) {
        formattedInputArray = Object.keys(input)
          .filter((inputName) => !inputName.startsWith('__') && inputName !== 'extraMetadata')
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
        extraMetadata,
        searchableText,
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
        .filter((it) => !(it.input?.['__context']?.['group']?.toString() as string)?.startsWith('temporary-'))
        .map((it) => {
          const { workflowId: execWorkflowId, input, output, ...rest } = pick(it, ['status', 'startTime', 'createTime', 'updateTime', 'endTime', 'workflowId', 'output', 'input']);

          const finalOutput = convertOutputFromRawOutput(output);

          const ctx = input?.['__context'];

          let formattedInput = null;

          const variables = workflow.variables;
          if (variables && input) {
            formattedInput = Object.keys(input)
              .filter((inputName) => !inputName.startsWith('__') && inputName !== 'extraMetadata')
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

          // 从输入数据中提取 extraMetadata
          let extraMetadata = input?.extraMetadata;
          if (typeof extraMetadata === 'string' && extraMetadata !== '') {
            try {
              extraMetadata = JSON.parse(Buffer.from(extraMetadata, 'base64').toString('utf-8'));
            } catch (e) {
              // 如果解析失败，保持原始值
              logger.warn('Failed to parse extraMetadata from base64', e);
            }
          }

          // 生成searchableText，优先使用提示词
          let searchableText = '';
          if (formattedInput && Array.isArray(formattedInput)) {
            // 尝试提取提示词
            const promptText = extractPromptFromFormattedInput(formattedInput);
            if (promptText) {
              searchableText = promptText.trim();
            } else {
              // 如果没有找到提示词，回退到原有逻辑
              const inputForSearch = input ? _.omit(input, ['__context', 'extraMetadata']) : null;
              const outputForSearch = output || null;
              searchableText = `${flattenObjectToSearchableText(inputForSearch)} ${flattenObjectToSearchableText(outputForSearch)}`.trim();
            }
          } else {
            // 如果没有formattedInput，使用原有逻辑
            const inputForSearch = input ? _.omit(input, ['__context', 'extraMetadata']) : null;
            const outputForSearch = output || null;
            searchableText = `${flattenObjectToSearchableText(inputForSearch)} ${flattenObjectToSearchableText(outputForSearch)}`.trim();
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
            extraMetadata,
            searchableText,
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

  public async startWorkflow(request: StartWorkflowRequest, temp = false) {
    const { teamId, userId, triggerType, chatSessionId, apiKey, group } = request;

    // 解码 extraMetadata
    let extraMetadata = (request.inputData?.extraMetadata as any) ?? {};
    logger.info('原始 extraMetadata:', extraMetadata, '类型:', typeof extraMetadata);

    if (typeof extraMetadata === 'string' && extraMetadata !== '') {
      try {
        const decodedString = Buffer.from(extraMetadata, 'base64').toString('utf-8');
        logger.debug('Base64 解码后的字符串:', decodedString);
        extraMetadata = JSON.parse(decodedString);
        logger.debug('JSON 解析后的 extraMetadata:', extraMetadata);
      } catch (e) {
        logger.warn('Failed to parse extraMetadata from base64, using it as a plain object.', e);
      }
    }

    // 过滤 extraMetadata，只保留必要的字段，排除可能包含大量数据的字段
    if (extraMetadata && typeof extraMetadata === 'object') {
      // 定义允许保存的元数据字段白名单
      const allowedMetadataKeys = ['userId', 'teamId', 'source', 'type', 'category', 'tags', 'version'];
      extraMetadata = pick(extraMetadata, allowedMetadataKeys);
    }

    const workflowContext: WorkflowExecutionContext = {
      userId,
      teamId: teamId,
      appId: config.server.appId,
    };
    let { version, workflowId } = request;
    if (!version) {
      version = await this.workflowRepository.getMaxVersion(workflowId);
    }

    const extra: Partial<Pick<WorkflowExecutionEntity, 'chatSessionId' | 'group'>> = {};

    if (!temp) {
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

      const originalWorkflowIdForShortcut = workflow.workflowId;

      const convertedWorkflow = await this.workflowRepository.convertWorkflowWhitShortcutsFlowId(workflow, version, true);
      if (convertedWorkflow) {
        extra['group'] = `shortcut-${originalWorkflowIdForShortcut}`;
        workflowId = convertedWorkflow.workflowId;
        version = convertedWorkflow.version;
      }
    }

    let { inputData = {} } = request;
    if (inputData?.__context) {
      throw new Error('inputData 不能包含内置参数 __context');
    }

    if (chatSessionId) {
      extra['chatSessionId'] = chatSessionId;
    }
    if (group) {
      extra['group'] = group;
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
    console.log('workflowInstanceId', workflowInstanceId);

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
      extraMetadata,
      ...(extra.chatSessionId && { chatSessionId: extra.chatSessionId }),
      ...(extra.group && { group: extra.group }),
      isTemporary: request.isTemporary || false,
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
    let workflowExecutionDetails;
    while (!finished) {
      workflowExecutionDetails = await this.getWorkflowExecutionDetail(teamId, workflowInstanceId);
      status = workflowExecutionDetails.status;
      finished = status === 'COMPLETED' || status === 'FAILED' || status === 'TERMINATED' || status === 'TIMED_OUT' || status === 'CANCELED' || status === 'PAUSED';
      output = workflowExecutionDetails.output;
      takes = workflowExecutionDetails.endTime ? workflowExecutionDetails.endTime - (workflowExecutionDetails.startTime || 0) : 0;
      await sleep(interval);
      if (+new Date() - start >= maxWait) {
        break;
      }
    }
    await this.workflowRepository.updateWorkflowExecutionStatus(workflowInstanceId, status, takes);

    // 修改：为所有完成状态（包括失败状态）触发事件
    if (status === 'COMPLETED' || status === 'FAILED' || status === 'TERMINATED' || status === 'TIMED_OUT' || status === 'CANCELED' || status === 'PAUSED') {
      this.eventEmitter.emit(`workflow.completed.${workflowInstanceId}`, {
        workflowInstanceId,
        result: workflowExecutionDetails,
        timestamp: Date.now(),
      });
    }

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
      // 过滤掉临时工作流的执行记录
      if ((execution.input?.['__context']?.['group']?.toString() as string)?.startsWith('temporary-')) {
        continue;
      }

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
      // 过滤掉临时工作流的执行记录
      if ((execution.input?.['__context']?.['group']?.toString() as string)?.startsWith('temporary-')) {
        continue;
      }

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
