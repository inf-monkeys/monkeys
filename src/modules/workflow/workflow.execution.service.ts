import { RATE_LIMITER_TOKEN } from '@/common/common.module';
import { conductorClient } from '@/common/conductor';
import { config } from '@/common/config';
import { OrderBy } from '@/common/dto/order.enum';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { WorkflowExecutionContext } from '@/common/dto/workflow-execution-context.dto';
import { TooManyRequestsException } from '@/common/exceptions/too-many-requests';
import { extractImageUrls, extractVideoUrls, flattenKeys, getDataType } from '@/common/utils';
import { RateLimiter } from '@/common/utils/rate-limiter';
import { sleep } from '@/common/utils/utils';
import { WorkflowExecutionEntity } from '@/database/entities/workflow/workflow-execution';
import { WorkflowMetadataEntity } from '@/database/entities/workflow/workflow-metadata';
import { WorkflowTriggerType } from '@/database/entities/workflow/workflow-trigger';
import { FindWorkflowCondition, WorkflowRepository } from '@/database/repositories/workflow.repository';
import { Task, Workflow } from '@inf-monkeys/conductor-javascript';
import { Inject, Injectable } from '@nestjs/common';
import _, { pick } from 'lodash';
import retry from 'retry-as-promised';
import { ConductorService } from './conductor/conductor.service';
import { SearchWorkflowExecutionsDto, SearchWorkflowExecutionsOrderDto, WorkflowExecutionSearchableField } from './dto/req/search-workflow-execution.dto';
import { UpdateTaskStatusDto } from './dto/req/update-task-status.dto';
import { DebugWorkflowRequest, StartWorkflowRequest, WorkflowExecutionOutput } from './interfaces';

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
    let groups = condition.groups || [];

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

    const shortcutIds = workflowsToSearch.map((it) => (it.shortcutsFlow ? `shortcut-${it.workflowId}` : null)).filter(Boolean);
    if (shortcutIds.length) {
      groups = groups.concat(shortcutIds);
    }

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
    let query: string[] = [];
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

    let workflowInstanceIdsToSearch: string[][] = [];

    const hasGroups = groups.length > 0;
    const shortcutOriginalWorkflows = new Map<string, WorkflowMetadataEntity>();

    if (workflowInstanceId) {
      workflowInstanceIdsToSearch.push([workflowInstanceId]);
    } else {
      const hasChatSessions = (chatSessionIds?.length ?? 0) > 0;
      if (hasChatSessions) {
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

      if (hasGroups) {
        const workflowInstancesStartByGroup = await this.workflowRepository.findExecutionsByGroups(groups);
        const workflowInstanceIdsStartByGroup = workflowInstancesStartByGroup.map((x) => x.workflowInstanceId);
        if (workflowInstanceIdsStartByGroup.length === 0) {
          return {
            definitions: [],
            data: [],
            page,
            limit,
            total: 0,
          };
        }

        for (const workflow of await this.workflowRepository.findWorkflowByIds(workflowInstancesStartByGroup.map((x) => x.workflowId))) {
          if (shortcutOriginalWorkflows.has(workflow.workflowId)) {
            continue;
          }
          shortcutOriginalWorkflows.set(workflow.workflowId, workflow);
        }

        if (hasChatSessions) {
          workflowInstanceIdsToSearch.push(_.uniq(workflowInstanceIdsStartByGroup.filter((it) => workflowInstanceIdsToSearch.flat().includes(it))));
        } else {
          workflowInstanceIdsToSearch.push(workflowInstanceIdsStartByGroup);
        }
        query = query.map((it) => (it.startsWith('workflowType') ? null : it)).filter(Boolean);
      }

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

    // 去重
    workflowInstanceIdsToSearch = _.uniq(workflowInstanceIdsToSearch);

    if (workflowInstanceIdsToSearch.length) {
      query.push(`workflowId IN (${workflowInstanceIdsToSearch.slice(0, 10).join(',')})`);
    }

    const { field = WorkflowExecutionSearchableField.startTime, order = OrderBy.DESC } = orderBy as SearchWorkflowExecutionsOrderDto;
    const sortText = `${field}:${order}`;

    const data = await retry(() => conductorClient.workflowResource.searchV21(start, limit, sortText, freeText, query.join(' AND ')), {
      max: 3,
    });

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
    for (const execution of executions) {
      this.conductorService.convertConductorTasksToVinesTasks(teamId, (execution.tasks || []) as Task[], execution.workflowDefinition);
    }

    const executionsWithMetadata = await this.populateMetadataByForExecutions(executions);

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
      definitions: definitions.map((it) => {
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
      limit,
      data: finalData,
      total: (data?.totalHits ?? 0) - filterCount,
    };
  }

  public async getWorkflowExecutionDetail(teamId: string, workflowInstanceId: string) {
    const data = await this.conductorService.getWorkflowExecutionStatus(teamId, workflowInstanceId);
    await this.populateMetadataByForExecutions([data]);
    return data;
  }

  public async getWorkflowExecutionSimpleDetail(teamId: string, workflowInstanceId: string) {
    const data = await this.conductorService.getWorkflowExecutionStatus(teamId, workflowInstanceId);
    await this.populateMetadataByForExecutions([data]);

    const { input, output } = data;

    let alt: string | string[] | undefined;

    const flattenOutput = flattenKeys(output, void 0, ['__display_text'], (_, data) => {
      alt = data;
    });

    const outputValues = Object.values(flattenOutput);

    const images = outputValues.map((it) => extractImageUrls(it)).flat();
    const videos = outputValues.map((it) => extractVideoUrls(it)).flat();

    const finalOutput = [];
    let isInserted = false;

    const outputValuesLength = outputValues.length;
    if (outputValuesLength === 1 && !images.length && !videos.length) {
      const currentOutput = outputValues[0];
      if (typeof currentOutput === 'string') {
        finalOutput.push({ type: 'text', data: currentOutput });
      } else {
        finalOutput.push({ type: 'json', data: currentOutput });
      }
      isInserted = true;
    }

    for (const image of images) {
      finalOutput.push({ type: 'image', data: image, alt });
      isInserted = true;
    }

    for (const video of videos) {
      finalOutput.push({ type: 'video', data: video });
      isInserted = true;
    }

    if (!isInserted) {
      finalOutput.push({ type: 'json', data: output });
    }

    const ctx = input?.['__context'];

    let formattedInput = null;

    const definitions = await this.workflowRepository.findWorkflowByIds([data.workflowName]);

    if (definitions.length > 0) {
      const { variables } = definitions[0];
      if (variables) {
        formattedInput = Object.keys(input)
          .filter((inputName) => !inputName.startsWith('__'))
          .map((inputName) => {
            const data = input[inputName];
            const variable = variables.find((variable) => variable.name === inputName);
            return {
              id: inputName,
              displayName: variable?.displayName || inputName,
              description: variable?.description || '',
              data,
              type: getDataType(data),
            };
          });
      }
    }

    return {
      ..._.pick(data, ['status', 'createTime', 'startTime', 'updateTime', 'endTime']),
      input: formattedInput,
      rawInput: input,
      output: finalOutput,
      rawOutput: output,
      workflowId: data.workflowName,
      instanceId: workflowInstanceId,
      userId: ctx.userId,
      teamId: ctx.teamId,
    };
  }

  public async getAllWorkflowsExecutionOutputs(
    teamId: string,
    condition = {
      page: 1,
      limit: 10,
      orderBy: 'DESC',
    },
  ) {
    const { page, limit, orderBy } = condition;
    const workflowList = await this.workflowRepository.getAllWorkflows(teamId);
    let allExecutions: WorkflowExecutionOutput[] = [];

    // FIXME: not recommend for getting all executions
    for (const workflow of workflowList) {
      try {
        const executions = (await this.getWorkflowExecutionOutputs(workflow.id, 1, 5000)).data;
        allExecutions = allExecutions.concat(executions);
      } catch (error) {}
    }

    allExecutions = allExecutions.sort((a, b) => (orderBy === 'DESC' ? b.startTime - a.startTime : a.startTime - b.startTime));

    const start = (page - 1) * limit;
    const end = start + limit;

    return {
      total: allExecutions.length,
      data: allExecutions.slice(start, end),
      page,
      limit,
      workflows: workflowList.map((workflow) => _.pick(workflow, ['displayName', 'description', 'id', 'iconUrl'])),
    };
  }

  public async getWorkflowExecutionOutputs(inputWorkflowId: string, page = 1, limit = 10) {
    let workflow = await this.workflowRepository.getWorkflowByIdWithoutVersion(inputWorkflowId);

    let shortcutsFlowInstanceIds: string[] = [];
    // 处理快捷方式
    const isShortcutFlow = workflow?.shortcutsFlow !== null;
    if (isShortcutFlow) {
      const convertedWorkflow = await this.workflowRepository.convertWorkflowWhitShortcutsFlowId(workflow);
      if (convertedWorkflow) {
        workflow = convertedWorkflow;
        shortcutsFlowInstanceIds = _.uniq((await this.workflowRepository.findExecutionsByGroups([`shortcut-${inputWorkflowId}`])).map((it) => it.workflowInstanceId));
      }
    }

    const start = (page - 1) * limit;
    const query = shortcutsFlowInstanceIds.length ? `workflowId IN (${shortcutsFlowInstanceIds.join(',')})` : `workflowType IN (${inputWorkflowId})`;

    const data = await retry(() => conductorClient.workflowResource.searchV21(start, limit, 'startTime:DESC', '*', query), {
      max: 3,
    });

    return {
      total: data?.totalHits ?? 0,
      data: (data?.results ?? [])
        .filter((it) => (!isShortcutFlow ? !(it.input?.['__context']?.['group']?.toString() as string)?.startsWith('shortcut') : true))
        .map((it) => {
          const { workflowId, input, output, ...rest } = pick(it, ['status', 'startTime', 'createTime', 'updateTime', 'endTime', 'workflowId', 'output', 'input']);

          let alt: string | string[] | undefined;

          const flattenOutput = flattenKeys(output, void 0, ['__display_text'], (_, data) => {
            alt = data;
          });

          const outputValues = Object.values(flattenOutput);

          const images = outputValues.map((it) => extractImageUrls(it)).flat();
          const videos = outputValues.map((it) => extractVideoUrls(it)).flat();

          const finalOutput = [];
          let isInserted = false;

          const outputValuesLength = outputValues.length;
          if (outputValuesLength === 1 && !images.length && !videos.length) {
            const currentOutput = outputValues[0];
            if (typeof currentOutput === 'string') {
              finalOutput.push({ type: 'text', data: currentOutput });
            } else {
              finalOutput.push({ type: 'json', data: currentOutput });
            }
            isInserted = true;
          }

          for (const image of images) {
            finalOutput.push({ type: 'image', data: image, alt });
            isInserted = true;
          }

          for (const video of videos) {
            finalOutput.push({ type: 'video', data: video });
            isInserted = true;
          }

          if (!isInserted) {
            finalOutput.push({ type: 'json', data: output });
          }

          const ctx = input?.['__context'];

          let formattedInput = null;

          const variables = workflow.variables;
          if (variables) {
            formattedInput = Object.keys(input)
              .filter((inputName) => !inputName.startsWith('__'))
              .map((inputName) => {
                const data = input[inputName];
                const variable = variables.find((variable) => variable.name === inputName);
                return {
                  id: inputName,
                  displayName: variable?.displayName || inputName,
                  description: variable?.description || '',
                  data,
                  type: getDataType(data),
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
            instanceId: workflowId,
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

    const extra: Partial<WorkflowExecutionEntity> = {};
    if (chatSessionId) {
      extra['chatSessionId'] = chatSessionId;
    }
    if (group) {
      extra['group'] = group;
    }

    // 处理快捷方式
    const convertedWorkflow = await this.workflowRepository.convertWorkflowWhitShortcutsFlowId(workflow, version, true);
    if (convertedWorkflow) {
      extra['group'] = `shortcut-${workflow.workflowId}`;

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
    await this.workflowRepository.saveWorkflowExecution({
      workflowId,
      version,
      workflowInstanceId,
      userId,
      triggerType,
      apiKey,
      ...extra,
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

  public async waitForWorkflowResult(teamId: string, workflowInstanceId: string, interval: number = 200, maxWiat: number = 600 * 1000) {
    let finished = false;
    let output: Record<string, any>;
    const start = +new Date();
    let status;
    let takes = 0;
    while (!finished) {
      const workflow = await this.getWorkflowExecutionDetail(teamId, workflowInstanceId);
      status = workflow.status;
      finished = status === 'COMPLETED' || status === 'FAILED' || status === 'TERMINATED' || status === 'TIMED_OUT';
      output = workflow.output;
      takes = workflow.endTime ? workflow.endTime - workflow.startTime : 0;
      await sleep(interval);
      if (+new Date() - start >= maxWiat) {
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
        const {
          workflowId,
          input: { __context, ...input },
          ...rest
        } = pick(execution, ['status', 'startTime', 'createTime', 'updateTime', 'endTime', 'workflowId', 'output', 'input']);
        return {
          instance: {
            ...rest,
            input,
            instanceId: workflowId,
            userId: __context?.userId ?? null,
            teamId: __context?.teamId ?? teamId,
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
