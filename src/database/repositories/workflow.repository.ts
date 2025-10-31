import { config } from '@/common/config';
import { ListDto } from '@/common/dto/list.dto';
import { WorkflowStatusEnum } from '@/common/dto/status.enum';
import { generateDbId } from '@/common/utils';
import { getNextCronTimestamp } from '@/common/utils/cron';
import { calcMd5 } from '@/common/utils/utils';
import { WorkflowChatSessionEntity } from '@/database/entities/workflow/workflow-chat-session';
import { WorkflowExecutionEntity } from '@/database/entities/workflow/workflow-execution';
import { WorkflowMetadataEntity, WorkflowOutputValue, WorkflowRateLimiter, WorkflowValidationIssue } from '@/database/entities/workflow/workflow-metadata';
import { WorkflowPageGroupEntity } from '@/database/entities/workflow/workflow-page-group';
import { WorkflowTriggersEntity, WorkflowTriggerType } from '@/database/entities/workflow/workflow-trigger';
import { I18nValue, MonkeyTaskDefTypes, ToolProperty } from '@inf-monkeys/monkeys';
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import _, { isEmpty, isString, keyBy, omit, pick } from 'lodash';
import { ChatCompletionMessageParam } from 'openai/resources';
import { DataSource, FindManyOptions, In, IsNull, MoreThan, Repository } from 'typeorm';
import { InstalledAppEntity } from '../entities/marketplace/installed-app.entity';
import { ToolsExecutionEntity } from '../entities/tools/tools-execution';
import { BaseWorkflowAssosciation, GlobalWorkflowAssociationsEntity, UpdateAndCreateGlobalWorkflowAssociations } from '../entities/workflow/global-workflow-association';
import { UpdateAndCreateWorkflowAssociation, WorkflowAssociationsEntity } from '../entities/workflow/workflow-association';
import { PageInstance, WorkflowPageEntity } from '../entities/workflow/workflow-page';
import { WorkflowAssetRepositroy } from './assets-workflow.respository';

export const BUILT_IN_PAGE_INSTANCES: PageInstance[] = [
  {
    name: '流程视图',
    type: 'process',
    allowedPermissions: ['read', 'write', 'exec', 'permission'],
    icon: '🚀',
  },
  {
    name: '日志视图',
    type: 'log',
    allowedPermissions: ['read', 'write'],
    icon: '📃',
  },
  {
    name: '预览视图',
    type: 'preview',
    allowedPermissions: ['read', 'write', 'exec', 'permission'],
    icon: '📷',
  },
  {
    name: '对话视图',
    type: 'chat',
    allowedPermissions: ['read', 'write', 'exec', 'permission'],
    icon: '💬',
  },
];

export interface FindWorkflowCondition {
  teamId: string;
  workflowId?: string;
  creatorUserId?: string;
}

@Injectable()
export class WorkflowRepository {
  constructor(
    @InjectRepository(WorkflowExecutionEntity)
    private readonly workflowExecutionRepository: Repository<WorkflowExecutionEntity>,
    @InjectRepository(WorkflowMetadataEntity)
    private readonly workflowMetadataRepository: Repository<WorkflowMetadataEntity>,
    @InjectRepository(WorkflowTriggersEntity)
    private readonly workflowTriggerRepository: Repository<WorkflowTriggersEntity>,
    @InjectRepository(WorkflowChatSessionEntity)
    private readonly workflowChatSessionRepository: Repository<WorkflowChatSessionEntity>,
    private readonly workflowAssetRepository: WorkflowAssetRepositroy,
    @InjectRepository(WorkflowPageEntity)
    private readonly pageRepository: Repository<WorkflowPageEntity>,
    @InjectRepository(WorkflowPageGroupEntity)
    private readonly pageGroupRepository: Repository<WorkflowPageGroupEntity>,
    @InjectRepository(WorkflowAssociationsEntity)
    private readonly workflowAssociationRepository: Repository<WorkflowAssociationsEntity>,
    @InjectRepository(GlobalWorkflowAssociationsEntity)
    private readonly globalWorkflowAssociationRepository: Repository<GlobalWorkflowAssociationsEntity>,
    @InjectRepository(ToolsExecutionEntity)
    private readonly toolsExecutionRepository: Repository<ToolsExecutionEntity>,
    private readonly dataSource: DataSource,
  ) {}

  public async findWorkflowByCondition(condition: FindWorkflowCondition) {
    return await this.workflowMetadataRepository.find({
      where: {
        ...condition,
        isDeleted: false,
      },
    });
  }

  public async createWorkflow(
    teamId: string,
    userId: string,
    workflowId: string,
    version: number,
    data: {
      displayName: string | I18nValue;
      description?: string | I18nValue;
      iconUrl?: string;
      tasks: MonkeyTaskDefTypes[];
      variables?: ToolProperty[];
      output: WorkflowOutputValue[];
      exposeOpenaiCompatibleInterface?: boolean;
      rateLimiter?: WorkflowRateLimiter;
      validationIssues?: WorkflowValidationIssue[];
      validated?: boolean;
      shortcutsFlow?: string;
    },
    useNewId = false,
  ) {
    const { displayName, description, iconUrl, tasks, variables, output, exposeOpenaiCompatibleInterface, shortcutsFlow, rateLimiter, validationIssues = [], validated = true } = data;

    const id = useNewId ? generateDbId() : workflowId;

    await this.workflowMetadataRepository.save({
      id,
      createdTimestamp: Date.now(),
      updatedTimestamp: Date.now(),
      isDeleted: false,
      workflowId,
      version,
      teamId: teamId,
      creatorUserId: userId,
      displayName,
      description,
      iconUrl,
      tasks,
      variables,
      output,
      exposeOpenaiCompatibleInterface,
      rateLimiter,
      validationIssues,
      validated,
      shortcutsFlow,
    });
    return await this.getWorkflowById(workflowId, version);
  }

  public async getWorkflowById(workflowId: string, version: number, throwError = true) {
    const workflow = await this.workflowMetadataRepository.findOne({
      where: {
        workflowId,
        version,
        isDeleted: false,
      },
    });
    if (!workflow && throwError) {
      throw new NotFoundException(`Workflow ${workflowId} not found`);
    }
    return workflow;
  }

  public async getWorkflowByRecordId(id: string, throwError = true) {
    const workflow = await this.workflowMetadataRepository.findOne({
      where: {
        id,
        isDeleted: false,
      },
    });
    if (!workflow && throwError) {
      throw new NotFoundException(`Workflow Record ${id} not found`);
    }
    return workflow;
  }

  public async getWorkflowByIdWithoutVersion(workflowId: string, throwError = true) {
    const maxVersion = await this.getMaxVersion(workflowId);
    return await this.getWorkflowById(workflowId, maxVersion, throwError);
  }

  public async findWorkflowByIds(workflowIds: string[]) {
    if (!workflowIds?.length) {
      return [];
    }
    return await this.workflowMetadataRepository.find({
      where: {
        workflowId: In(workflowIds),
        isDeleted: false,
      },
    });
  }

  public async getAllWorkflowsInTeam(teamId: string) {
    return await this.workflowMetadataRepository.find({
      where: {
        teamId,
        isDeleted: false,
      },
    });
  }

  private calcWorkflowMd5(workflow: Partial<WorkflowMetadataEntity>) {
    const str = JSON.stringify(_.pick(workflow, ['tasks', 'variables', 'output'] as (keyof WorkflowMetadataEntity)[]));
    return calcMd5(str);
  }

  async updateWorkflowDef(
    teamId: string,
    workflowId: string,
    version: number,
    updates: {
      displayName?: string | I18nValue;
      description?: string | I18nValue;
      iconUrl?: string;
      tasks?: MonkeyTaskDefTypes[];
      variables?: ToolProperty[];
      activated?: boolean;
      validated?: boolean;
      validationIssues?: WorkflowValidationIssue[];
      output?: WorkflowOutputValue[];
      tagIds?: string[];
      rateLimiter?: WorkflowRateLimiter;
      exposeOpenaiCompatibleInterface?: boolean;
      openaiModelName?: string;
      shortcutsFlow?: string;
      forkFromId?: string;
      preferAppId?: string;
    },
    autoBackup = true,
  ) {
    const {
      displayName,
      description,
      iconUrl,
      tasks,
      variables,
      activated,
      validationIssues,
      validated,
      output,
      tagIds,
      rateLimiter,
      exposeOpenaiCompatibleInterface,
      openaiModelName,
      shortcutsFlow,
      forkFromId,
      preferAppId,
    } = updates;

    // 字段都为空，则跳过更新
    if (
      [
        displayName,
        description,
        iconUrl,
        tasks,
        variables,
        activated,
        validated,
        validationIssues,
        output,
        tagIds,
        rateLimiter,
        exposeOpenaiCompatibleInterface,
        openaiModelName,
        shortcutsFlow,
        forkFromId,
        preferAppId,
      ].every((item) => typeof item === 'undefined')
    )
      return;
    if (variables && !Array.isArray(variables)) {
      throw new Error('variables 字段必须为数组');
    }
    if (output && !Array.isArray(output)) {
      throw new Error('output 字段必须为数组');
    }

    // 检查 shortcutsFlow 对应的工作流是否存在
    if (isString(shortcutsFlow)) {
      const [shortcutsFlowId, shortcutsFlowVersionString] = shortcutsFlow.split(':');
      if (!(await this.checkWorkflowExists(shortcutsFlowId, parseInt(shortcutsFlowVersionString)))) {
        throw new Error('shortcutsFlow 对应的工作流不存在');
      }
      if (shortcutsFlowId === workflowId) {
        throw new Error('shortcutsFlow 不能指向自身');
      }
      // 此处应有授权逻辑
    }

    // Check if openaiModelName is unique
    if (openaiModelName) {
      const existingWorkflow = await this.findWorkflowByOpenAIModelName(teamId, openaiModelName);
      if (existingWorkflow && existingWorkflow.workflowId !== workflowId) {
        throw new Error('openaiModelName must be unique');
      }
    }

    const originWorkflow = await this.workflowMetadataRepository.findOneOrFail({ where: { workflowId: workflowId, version, teamId, isDeleted: false } });
    if (autoBackup) {
      const backupVersion = 0 - originWorkflow.version;
      // 检查备份版本是否已存在
      const existingBackup = await this.workflowMetadataRepository.findOne({
        where: { workflowId: workflowId, version: backupVersion, teamId, isDeleted: false },
      });
      if (existingBackup) {
        // 如果备份版本已存在，更新它
        await this.updateWorkflowDef(teamId, workflowId, backupVersion, originWorkflow, false);
      } else {
        // 如果备份版本不存在，创建它
        await this.createWorkflow(
          teamId,
          originWorkflow.creatorUserId,
          workflowId,
          backupVersion,
          {
            displayName: originWorkflow.displayName,
            description: originWorkflow.description,
            iconUrl: originWorkflow.iconUrl,
            tasks: originWorkflow.tasks,
            variables: originWorkflow.variables,
            output: originWorkflow.output,
            exposeOpenaiCompatibleInterface: originWorkflow.exposeOpenaiCompatibleInterface,
            rateLimiter: originWorkflow.rateLimiter,
            validationIssues: originWorkflow.validationIssues,
            validated: originWorkflow.validated,
            shortcutsFlow: originWorkflow.shortcutsFlow,
          },
          true, // useNewId = true 来生成新的主键ID
        );
      }
    }
    const updateFields = {
      ..._.pickBy(
        {
          displayName,
          iconUrl,
          description,
          tasks,
          variables,
          activated,
          validationIssues,
          validated,
          output,
          tagIds,
          rateLimiter,
          exposeOpenaiCompatibleInterface,
          openaiModelName,
          shortcutsFlow,
          forkFromId,
          preferAppId,
        },
        (v) => typeof v !== 'undefined',
      ),
      updatedTimestamp: Date.now(),
    };

    const result = await this.workflowMetadataRepository.update({ workflowId, isDeleted: false, teamId, version }, updateFields);

    if (!result.affected) {
      throw new Error('Update workflow failed');
    }

    const workflow = await this.workflowMetadataRepository.findOne({
      where: {
        teamId,
        workflowId,
        version,
        isDeleted: false,
      },
    });
    workflow.md5 = this.calcWorkflowMd5(workflow);
    await this.workflowMetadataRepository.save(workflow);
    return workflow;
  }

  public async rollbackWorkflow(teamId: string, workflowId: string, version: number) {
    const backupVersion = 0 - version;
    const backupWorkflow = await this.workflowMetadataRepository.findOne({ where: { workflowId, version: backupVersion, teamId, isDeleted: false } });
    if (!backupWorkflow) {
      throw new Error('Backup workflow not found');
    }
    const workflow = await this.updateWorkflowDef(teamId, workflowId, version, backupWorkflow, false);
    return workflow;
  }

  public async findAndCountWorkflowExecutions(options: FindManyOptions<WorkflowExecutionEntity>): Promise<[WorkflowExecutionEntity[], number]> {
    return this.workflowExecutionRepository.findAndCount(options);
  }

  public async findAllExecutions(options: FindManyOptions<WorkflowExecutionEntity>): Promise<[WorkflowExecutionEntity[], number]> {
    return this.workflowExecutionRepository.findAndCount(options);
  }

  public async findExecutionsByWorkflowInstanceIds(workflowInstanceIds: string[]) {
    if (!workflowInstanceIds?.length) {
      return [];
    }
    return await this.workflowExecutionRepository.find({
      where: {
        workflowInstanceId: In(workflowInstanceIds),
      },
    });
  }

  public async findExecutionsByChatSessionId(chatSessionId: string) {
    return await this.workflowExecutionRepository.find({
      where: {
        chatSessionId: chatSessionId,
      },
    });
  }

  public async findExecutionsByChatSessionIds(chatSessionIds: string[]) {
    if (!chatSessionIds?.length) {
      return [];
    }
    return await this.workflowExecutionRepository.find({
      where: {
        chatSessionId: In(chatSessionIds),
      },
    });
  }

  public async findExecutionsByGroup(group: string) {
    return await this.workflowExecutionRepository.find({
      where: {
        group,
      },
    });
  }

  public async findExecutionsByGroups(groups: string[]) {
    if (!groups?.length) {
      return [];
    }
    return await this.workflowExecutionRepository.find({
      where: {
        group: In(groups),
      },
    });
  }

  public async findExecutionsByTriggerTypes(triggerTypes: WorkflowTriggerType[]) {
    if (!triggerTypes?.length) {
      return [];
    }
    return await this.workflowExecutionRepository.find({
      where: {
        triggerType: In(triggerTypes),
      },
    });
  }

  public async findExecutionsByUserIds(userIds: string[]) {
    if (!userIds?.length) {
      return [];
    }
    return await this.workflowExecutionRepository.find({
      where: {
        userId: In(userIds),
      },
    });
  }

  public async deleteWorkflow(teamId: string, workflowId: string) {
    // 开启事务
    await this.dataSource.transaction(async (transactionalEntityManager) => {
      // 标记 workflow 为已删除
      await transactionalEntityManager.update(
        WorkflowMetadataEntity,
        {
          teamId,
          ...(workflowId === '*' ? {} : { workflowId }),
        },
        {
          isDeleted: true,
        },
      );

      // 标记相关的 trigger 为已删除
      await transactionalEntityManager.update(
        WorkflowTriggersEntity,
        {
          ...(workflowId === '*' ? {} : { workflowId }),
        },
        {
          isDeleted: true,
        },
      );

      // 获取所有相关的 pages
      const pages = await transactionalEntityManager.find(WorkflowPageEntity, {
        where: {
          ...(workflowId === '*' ? {} : { workflowId }),
        },
        select: ['id'],
      });

      if (pages.length > 0) {
        // 获取所有 page groups
        const pageGroups = await transactionalEntityManager.find(WorkflowPageGroupEntity, {
          where: {
            teamId,
          },
        });

        // 从每个 page group 中移除被删除的 page ids
        const pageIdsToRemove = pages.map((page) => page.id);
        for (const group of pageGroups) {
          if (group.pageIds?.length) {
            group.pageIds = group.pageIds.filter((id) => !pageIdsToRemove.includes(id));
            await transactionalEntityManager.save(WorkflowPageGroupEntity, group);
          }
        }
      }

      // 标记相关的 pages 为已删除
      await transactionalEntityManager.update(
        WorkflowPageEntity,
        {
          ...(workflowId === '*' ? {} : { workflowId }),
        },
        {
          isDeleted: true,
        },
      );

      // 删除 installed apps 中的记录
      if (workflowId === '*') {
        await transactionalEntityManager.delete(InstalledAppEntity, {});
      } else {
        await transactionalEntityManager.delete(InstalledAppEntity, {
          installedAssetIds: {
            workflow: [workflowId],
          },
        });
      }
    });
  }

  public async getWorkflowVersions(workflowId: string) {
    return await this.workflowMetadataRepository.find({
      where: {
        workflowId,
        isDeleted: false,
        version: MoreThan(0),
      },
    });
  }

  public async getMaxVersion(workflowId: string) {
    const versions = await this.workflowMetadataRepository.find({
      where: {
        workflowId,
      },
    });
    if (versions?.length === 0) {
      return 1;
    }
    return Math.max(...versions.map((x) => x.version));
  }

  public async findWebhookTrigger(webhookPath: string) {
    return await this.workflowTriggerRepository.findOne({
      where: {
        type: WorkflowTriggerType.WEBHOOK,
        webhookPath,
      },
    });
  }

  public async saveWorkflowExecution({
    workflowId,
    version,
    workflowInstanceId,
    userId,
    triggerType,
    chatSessionId,
    apiKey,
    group,
    extraMetadata,
    isTemporary = false,
  }: {
    workflowId: string;
    version: number;
    workflowInstanceId: string;
    userId: string;
    triggerType: WorkflowTriggerType;
    chatSessionId?: string;
    apiKey: string;
    group?: string;
    extraMetadata?: { [x: string]: any };
    isTemporary?: boolean;
  }) {
    await this.workflowExecutionRepository.save({
      id: generateDbId(),
      createdTimestamp: Date.now(),
      updatedTimestamp: Date.now(),
      isDeleted: false,
      workflowId,
      workflowVersion: version,
      workflowInstanceId,
      userId,
      triggerType,
      chatSessionId,
      apikey: apiKey,
      group,
      extraMetadata,
      isTemporary,
    });
  }

  public async updateWorkflowExecutionStatus(workflowInstanceId: string, status: WorkflowStatusEnum, takes: number) {
    await this.workflowExecutionRepository.update(
      {
        workflowInstanceId,
      },
      {
        status,
        updatedTimestamp: Date.now(),
        takes,
      },
    );
  }

  // 原方法：只查一条
  // public async fetchWorkflowExecutionWithNoStatus() {
  //   return await this.workflowExecutionRepository.findOne({
  //     where: [
  //       {
  //         status: IsNull(),
  //       },
  //       {
  //         status: WorkflowStatusEnum.RUNNING,
  //       },
  //     ],
  //   });
  // }

  // 新方法：批量查多条
  public async fetchWorkflowExecutionsWithNoStatus(limit = 10) {
    return await this.workflowExecutionRepository.find({
      where: [
        {
          status: IsNull(),
        },
        {
          status: WorkflowStatusEnum.RUNNING,
        },
      ],
      take: limit,
      order: { createdTimestamp: 'ASC' },
    });
  }

  public async updateWorkflowExecutionDetailsByInstanceId(workflowInstanceId: string, updateData: Partial<WorkflowExecutionEntity>): Promise<void> {
    await this.workflowExecutionRepository.update({ workflowInstanceId }, updateData);
  }

  public async createToolsExecution(toolsExecution: ToolsExecutionEntity, workflowInstanceId: string): Promise<ToolsExecutionEntity> {
    return await this.dataSource.transaction(async (transactionalEntityManager) => {
      const workflowExecution = await transactionalEntityManager.findOne(WorkflowExecutionEntity, { where: { workflowInstanceId } });
      if (!workflowExecution) {
        throw new Error('Workflow execution not found');
      }
      return await transactionalEntityManager.save(ToolsExecutionEntity, {
        ...toolsExecution,
        workflowExecutionId: workflowExecution.id,
      });
    });
  }

  private getDateList(startTimestamp: number, endTimestamp: number) {
    const startDate = new Date(startTimestamp);
    const endDate = new Date(endTimestamp);
    endDate.setDate(endDate.getDate() + 1);

    const dateList = [];
    const currentDate = startDate;

    while (currentDate <= endDate) {
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getDate()).padStart(2, '0');

      dateList.push(`${year}-${month}-${day}`);

      // Move to the next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dateList;
  }

  public async getWorkflowExecutionStatisticsByWorkflowId(workflowId: string, startTimestamp: number, endTimestamp: number, onlyGroup?: boolean) {
    const appId = config.server.appId;
    const groupCondition = onlyGroup ? `"group" LIKE 'shortcut-%'` : `("group" IS NULL OR "group" NOT LIKE 'shortcut-%')`;

    const callsPerDateSql = `
SELECT
    workflow_id,
    TO_CHAR(TO_TIMESTAMP(created_timestamp/ 1000), 'YYYY-MM-DD') AS date,
    COUNT(*) AS total_calls
FROM
    ${appId}_workflow_execution
WHERE workflow_id = '${workflowId}' AND created_timestamp >= ${startTimestamp} AND created_timestamp <= ${endTimestamp}
  AND ${groupCondition}
  AND is_temporary = false
GROUP BY
    workflow_id,
    TO_CHAR(TO_TIMESTAMP(created_timestamp/1000), 'YYYY-MM-DD')
ORDER BY
    workflow_id,
    date;
    `;

    const successPerDateSql = `
SELECT
    workflow_id,
    TO_CHAR(TO_TIMESTAMP(created_timestamp/ 1000), 'YYYY-MM-DD') AS date,
    COUNT(*) AS total_calls
FROM
    ${appId}_workflow_execution
WHERE workflow_id = '${workflowId}' AND status = 'COMPLETED' AND created_timestamp >= ${startTimestamp} AND created_timestamp <= ${endTimestamp}
  AND ${groupCondition}
  AND is_temporary = false
GROUP BY
    workflow_id,
    TO_CHAR(TO_TIMESTAMP(created_timestamp/1000), 'YYYY-MM-DD')
ORDER BY
    workflow_id,
    date;
`;

    const failedPerDateSql = `
SELECT
    workflow_id,
    TO_CHAR(TO_TIMESTAMP(created_timestamp/ 1000), 'YYYY-MM-DD') AS date,
    COUNT(*) AS total_calls
FROM
    ${appId}_workflow_execution
WHERE workflow_id = '${workflowId}' AND status in ('FAILED','TERMINATED','PAUSED') AND created_timestamp >= ${startTimestamp} AND created_timestamp <= ${endTimestamp}
  AND ${groupCondition}
  AND is_temporary = false
GROUP BY
    workflow_id,
    TO_CHAR(TO_TIMESTAMP(created_timestamp/1000), 'YYYY-MM-DD')
ORDER BY
    workflow_id,
    date;
`;

    const averageTakesPerDateSql = `
SELECT
  workflow_id,
  TO_CHAR(TO_TIMESTAMP(created_timestamp / 1000), 'YYYY-MM-DD') AS date,
  AVG(takes) AS average_time
FROM
  ${appId}_workflow_execution
WHERE
  status = 'COMPLETED' AND workflow_id = '${workflowId}' AND created_timestamp >= ${startTimestamp} AND created_timestamp <= ${endTimestamp}
  AND ${groupCondition}
  AND is_temporary = false
GROUP BY
  workflow_id,
  date
ORDER BY
  workflow_id,
  date;
    `;

    const dateList = this.getDateList(startTimestamp, endTimestamp);
    const [callsPerDayResult, successPerDayResult, failedPerDayResult, averageTakesPerDayResult] = await Promise.all([
      this.workflowExecutionRepository.query(callsPerDateSql),
      this.workflowExecutionRepository.query(successPerDateSql),
      this.workflowExecutionRepository.query(failedPerDateSql),
      this.workflowExecutionRepository.query(averageTakesPerDateSql),
    ]);

    const result: Array<{
      date: string;
      totalCount: number;
      successCount: number;
      failedCount: number;
      averageTime: number;
    }> = [];
    for (const date of dateList) {
      const callsPerDay = callsPerDayResult.find((x: { date: any }) => x.date === date);
      const successPerDay = successPerDayResult.find((x: { date: any }) => x.date === date);
      const failedPerDay = failedPerDayResult.find((x: { date: any }) => x.date === date);
      const averageTakesPerDay = averageTakesPerDayResult.find((x: { date: any }) => x.date === date);
      result.push({
        date,
        totalCount: parseInt(callsPerDay?.total_calls) || 0,
        successCount: parseInt(successPerDay?.total_calls) || 0,
        failedCount: parseInt(failedPerDay?.total_calls) || 0,
        averageTime: parseInt(averageTakesPerDay?.average_time) || 0,
      });
    }
    return result;
  }

  public async getWorkflowExecutionStatisticsByTeamId(teamId: string, startTimestamp: number, endTimestamp: number) {
    const dateList = this.getDateList(startTimestamp, endTimestamp);

    const appId = config.server.appId;
    const workflowIds = _.uniq(
      (
        await this.workflowMetadataRepository.find({
          where: {
            teamId,
          },
          select: ['workflowId'],
        })
      ).map((x) => x.workflowId),
    );

    if (workflowIds.length === 0) {
      return dateList.map((date) => {
        return {
          date,
          totalCount: 0,
          successCount: 0,
          failedCount: 0,
          averageTime: 0,
        };
      });
    }

    const workflowIdsStr = workflowIds.map((x) => `'${x}'`).join(',');
    const callsPerDateSql = `
SELECT
    workflow_id,
    TO_CHAR(TO_TIMESTAMP(created_timestamp/ 1000), 'YYYY-MM-DD') AS date,
    COUNT(*) AS total_calls
FROM
    ${appId}_workflow_execution
WHERE workflow_id IN (${workflowIdsStr}) AND created_timestamp >= ${startTimestamp} AND created_timestamp <= ${endTimestamp}
  AND is_temporary = false
GROUP BY
    workflow_id,
    TO_CHAR(TO_TIMESTAMP(created_timestamp/1000), 'YYYY-MM-DD')
ORDER BY
    workflow_id,
    date;
    `;

    const successPerDateSql = `
SELECT
    workflow_id,
    TO_CHAR(TO_TIMESTAMP(created_timestamp/ 1000), 'YYYY-MM-DD') AS date,
    COUNT(*) AS total_calls
FROM
    ${appId}_workflow_execution
WHERE workflow_id IN (${workflowIdsStr}) AND status = 'COMPLETED' AND created_timestamp >= ${startTimestamp} AND created_timestamp <= ${endTimestamp}
  AND is_temporary = false
GROUP BY
    workflow_id,
    TO_CHAR(TO_TIMESTAMP(created_timestamp/1000), 'YYYY-MM-DD')
ORDER BY
    workflow_id,
    date;
`;

    const failedPerDateSql = `
SELECT
    workflow_id,
    TO_CHAR(TO_TIMESTAMP(created_timestamp/ 1000), 'YYYY-MM-DD') AS date,
    COUNT(*) AS total_calls
FROM
    ${appId}_workflow_execution
WHERE workflow_id IN (${workflowIdsStr}) AND status in ('FAILED','TERMINATED','PAUSED') AND created_timestamp >= ${startTimestamp} AND created_timestamp <= ${endTimestamp}
  AND is_temporary = false
GROUP BY
    workflow_id,
    TO_CHAR(TO_TIMESTAMP(created_timestamp/1000), 'YYYY-MM-DD')
ORDER BY
    workflow_id,
    date;
`;

    const averageTakesPerDateSql = `
SELECT
  workflow_id,
  TO_CHAR(TO_TIMESTAMP(created_timestamp / 1000), 'YYYY-MM-DD') AS date,
  AVG(takes) AS average_time
FROM
  ${appId}_workflow_execution
WHERE
  status = 'COMPLETED' AND workflow_id IN (${workflowIdsStr}) AND created_timestamp >= ${startTimestamp} AND created_timestamp <= ${endTimestamp}
  AND is_temporary = false
GROUP BY
  workflow_id,
  date
ORDER BY
  workflow_id,
  date;
    `;

    const [callsPerDayResult, successPerDayResult, failedPerDayResult, averageTakesPerDayResult] = await Promise.all([
      this.workflowExecutionRepository.query(callsPerDateSql),
      this.workflowExecutionRepository.query(successPerDateSql),
      this.workflowExecutionRepository.query(failedPerDateSql),
      this.workflowExecutionRepository.query(averageTakesPerDateSql),
    ]);

    const result: Array<{
      date: string;
      totalCount: number;
      successCount: number;
      failedCount: number;
      averageTime: number;
    }> = [];
    for (const date of dateList) {
      const callsPerDay = callsPerDayResult.find((x: { date: any }) => x.date === date);
      const successPerDay = successPerDayResult.find((x: { date: any }) => x.date === date);
      const failedPerDay = failedPerDayResult.find((x: { date: any }) => x.date === date);
      const averageTakesPerDay = averageTakesPerDayResult.find((x: { date: any }) => x.date === date);
      result.push({
        date,
        totalCount: parseInt(callsPerDay?.total_calls) || 0,
        successCount: parseInt(successPerDay?.total_calls) || 0,
        failedCount: parseInt(failedPerDay?.total_calls) || 0,
        averageTime: parseInt(averageTakesPerDay?.average_time) || 0,
      });
    }
    return result;
  }

  public async deleteTrigger(workflowId: string, triggerId: string) {
    return await this.workflowTriggerRepository.update(
      {
        id: triggerId,
        workflowId,
      },
      {
        isDeleted: true,
      },
    );
  }

  public async listWorkflowTriggers(workflowId: string, version: number) {
    return await this.workflowTriggerRepository.find({
      where: {
        workflowId,
        isDeleted: false,
        workflowVersion: version,
      },
    });
  }

  public async createWorkflowTrigger(data: Partial<WorkflowTriggersEntity>) {
    const entity: Partial<WorkflowTriggersEntity> = {
      ...data,
      createdTimestamp: Date.now(),
      updatedTimestamp: Date.now(),
      isDeleted: false,
    };
    await this.workflowTriggerRepository.save(entity);
  }

  public async getWorkflowTrigger(triggerId: string) {
    return await this.workflowTriggerRepository.findOne({
      where: {
        id: triggerId,
        isDeleted: false,
      },
    });
  }

  public async saveWorkflowTrigger(entity: WorkflowTriggersEntity) {
    return await this.workflowTriggerRepository.save(entity);
  }

  public async disableAllTriggers(workflowId: string) {
    await this.workflowTriggerRepository.update(
      {
        workflowId,
      },
      {
        enabled: false,
      },
    );
  }

  public async getTriggersToRun() {
    const currentTimestamp = +new Date();
    const query = this.workflowTriggerRepository
      .createQueryBuilder('workflow_trigger')
      .where('workflow_trigger.enabled = :enabled', { enabled: true })
      .andWhere('workflow_trigger.type = :type', { type: WorkflowTriggerType.SCHEDULER })
      .andWhere('(workflow_trigger.next_trigger_time IS NULL OR workflow_trigger.next_trigger_time < :currentTimestamp)', { currentTimestamp })
      .andWhere('workflow_trigger.is_deleted = :isDeleted', { isDeleted: false });
    return await query.getMany();
  }

  public async updateNextTriggerTime(currentTimestamp: number, triggers: WorkflowTriggersEntity[]) {
    const triggersToUpdate = triggers.map((x) => {
      x.nextTriggerTime = getNextCronTimestamp(x.cron);
      x.lastTriggerTime = currentTimestamp;
      return x;
    });
    await this.workflowTriggerRepository.save(triggersToUpdate);
  }

  public async createChatSession(teamId: string, userId: string, workflowId: string, displayName: string) {
    const id = generateDbId();
    const timestamp = +new Date();
    const entity: Partial<WorkflowChatSessionEntity> = {
      id: id,
      displayName,
      workflowId,
      teamId,
      creatorUserId: userId,
      createdTimestamp: timestamp,
      updatedTimestamp: timestamp,
      isDeleted: false,
    };
    await this.workflowChatSessionRepository.save(entity);
    return entity;
  }

  public async listChatSessions(teamId: string, workflowId: string) {
    return await this.workflowChatSessionRepository.find({
      where: {
        teamId,
        workflowId,
        isDeleted: false,
      },
      select: ['id', 'displayName', 'createdTimestamp', 'updatedTimestamp', 'creatorUserId', 'isDeleted', 'teamId', 'workflowId'],
      order: {
        id: 'DESC',
      },
    });
  }

  public async getChatSessionMessages(teamId: string, sessionId: string): Promise<Array<ChatCompletionMessageParam>> {
    const session = await this.workflowChatSessionRepository.findOne({
      where: {
        id: sessionId,
        isDeleted: false,
        teamId,
      },
    });
    if (!session) {
      return [];
    }
    return session?.messages || [];
  }

  public async deleteChatSession(teamId: string, sessionId: string) {
    await this.workflowChatSessionRepository.update(
      {
        id: sessionId,
        teamId,
        isDeleted: false,
      },
      {
        isDeleted: true,
      },
    );
    return {
      success: true,
    };
  }

  public async updateChatSession(teamId: string, sessionId: string, updates: Partial<WorkflowChatSessionEntity>) {
    await this.workflowChatSessionRepository.update(
      {
        id: sessionId,
        teamId,
        isDeleted: false,
      },
      updates,
    );
    return {
      success: true,
    };
  }

  public async updateChatSessionMessages(teamId: string, sessionId: string, messages: Array<ChatCompletionMessageParam>) {
    await this.workflowChatSessionRepository.update(
      {
        id: sessionId,
        teamId,
        isDeleted: false,
      },
      {
        messages,
      },
    );
    return {
      success: true,
    };
  }

  public async getAllWorkflows(teamId: string) {
    return await this.workflowMetadataRepository.find({
      where: {
        teamId,
        isDeleted: false,
      },
    });
  }

  public async listWorkflows(
    teamId: string,
    dto: ListDto,
  ): Promise<{
    totalCount: number;
    list: WorkflowMetadataEntity[];
  }> {
    const { page = 1, limit = 24, orderBy = 'DESC', orderColumn = 'createdTimestamp', filter, search } = dto;
    const searchText = typeof search === 'string' ? search.trim() : '';

    // Prepare a subquery to find the latest version for each workflow.
    const latestVersionSubquery = this.workflowMetadataRepository
      .createQueryBuilder('w')
      .select('w.workflow_id', 'workflow_id')
      .addSelect('MAX(w.version)', 'max_version')
      .where('w.team_id = :teamId', { teamId })
      .andWhere('w.is_deleted = false')
      .andWhere('w.is_published = false')
      .groupBy('w.workflow_id');

    if (filter) {
      // Apply any additional filters here using your `findAssetIdsByCommonFilter` logic.
      const workflowIds = await this.workflowAssetRepository.findAssetIdsByCommonFilter('workflow', filter, 'workflowId');
      if (workflowIds.length === 0) {
        return { totalCount: 0, list: [] };
      }
      latestVersionSubquery.andWhere('w.workflow_id IN (:...workflowIds)', { workflowIds });
    }

    const workflowsQueryBuilder = this.workflowMetadataRepository
      .createQueryBuilder('w')
      .innerJoin(`(${latestVersionSubquery.getQuery()})`, 'latest', 'w.workflow_id = latest.workflow_id AND w.version = latest.max_version AND w.is_published = false')
      .setParameters(latestVersionSubquery.getParameters());

    if (searchText) {
      workflowsQueryBuilder.andWhere('(w.display_name ILIKE :search OR w.description ILIKE :search)', {
        search: `%${searchText}%`,
      });
    }

    // Count total number of workflows
    const totalCount = await workflowsQueryBuilder.getCount();

    // Apply ordering
    const validOrderColumns = {
      createdTimestamp: 'w.created_timestamp',
      updatedTimestamp: 'w.updated_timestamp',
    };
    const orderColumnSql = validOrderColumns[orderColumn] || 'w.created_timestamp';

    // Apply pagination
    const workflows = await workflowsQueryBuilder
      .orderBy(orderColumnSql, orderBy.toUpperCase() === 'ASC' ? 'ASC' : 'DESC')
      .limit(limit)
      .offset((page - 1) * limit)
      .getMany();

    return {
      totalCount,
      list: workflows,
    };
  }

  async listWorkflowPagesAndCreateIfNotExists(workflowId: string) {
    const workflow = await this.getWorkflowByIdWithoutVersion(workflowId);
    let pages: WorkflowPageEntity[];
    const existsPages = await this.pageRepository.find({
      where: {
        workflowId,
        isDeleted: false,
      },
      order: {
        sortIndex: 1,
      },
    });
    if (existsPages.length > 0) {
      pages = existsPages;
    } else {
      let sortIndex = 0;
      pages = BUILT_IN_PAGE_INSTANCES.map((item) => ({
        id: generateDbId(),
        type: item.type,
        displayName: item.name,
        workflowId,
        isBuiltIn: true,
        teamId: workflow.teamId,
        permissions: item.allowedPermissions, // 默认授予全部权限
        sortIndex: ++sortIndex,
        createdTimestamp: Date.now(),
        updatedTimestamp: Date.now(),
        isDeleted: false,
      }));
      await this.pageRepository.save(pages);
    }
    const pageInstanceTypeMapper = keyBy(BUILT_IN_PAGE_INSTANCES, 'type');
    return pages.map((page) => ({
      ...page,
      instance: pageInstanceTypeMapper[page.type],
    }));
  }

  async updatePagePinStatus(teamId: string, pageId: string, pin: boolean) {
    const defaultGroup = await this.getDefaultPageGroupAndCreateIfNotExists(teamId);

    if (pin) {
      if (!defaultGroup.pageIds.includes(pageId)) {
        defaultGroup.pageIds.push(pageId);
      }
    } else {
      const index = defaultGroup.pageIds.findIndex((id) => id === pageId);
      if (index !== -1) {
        defaultGroup.pageIds.splice(index, 1);
      }
    }

    await this.pageGroupRepository.save(defaultGroup);
  }

  public async getDefaultPageGroupAndCreateIfNotExists(teamId: string) {
    const defaultGroup = await this.pageGroupRepository.findOne({
      where: {
        teamId,
        isBuiltIn: true,
      },
    });
    if (!defaultGroup) {
      const group = this.pageGroupRepository.create({
        id: generateDbId(),
        displayName: JSON.stringify({
          'zh-CN': '默认',
          'en-US': 'Default',
        }),
        isBuiltIn: true,
        teamId,
        pageIds: [],
        createdTimestamp: Date.now(),
        updatedTimestamp: Date.now(),
      });
      await this.pageGroupRepository.save(group);

      return group;
    }

    return defaultGroup;
  }

  public async getPageGroupsAndCreateIfNotExists(teamId: string, groupDisplayNames: string[]) {
    const existsGroups = await this.pageGroupRepository.find({
      where: {
        teamId,
        isBuiltIn: false,
      },
    });
    const defaultGroup = await this.getDefaultPageGroupAndCreateIfNotExists(teamId);

    const groups = groupDisplayNames.map((displayName) => {
      if (displayName === 'default') {
        return defaultGroup;
      }

      const existsGroup = existsGroups.find((group) => group.displayName === displayName);
      if (existsGroup) {
        return existsGroup;
      }

      return this.pageGroupRepository.create({
        id: generateDbId(),
        displayName,
        isBuiltIn: false,
        teamId,
        pageIds: [],
        createdTimestamp: Date.now(),
        updatedTimestamp: Date.now(),
      });
    });

    await this.pageGroupRepository.save(groups);

    return groups;
  }

  public async updatePageGroup(groupId: string, updates: Partial<WorkflowPageGroupEntity>) {
    await this.pageGroupRepository.update(
      {
        id: groupId,
      },
      updates,
    );
  }

  public async listAllOpenAICompatibleWorkflows(teamId: string) {
    return await this.workflowMetadataRepository.find({
      where: {
        teamId,
        exposeOpenaiCompatibleInterface: true,
        isDeleted: false,
      },
    });
  }

  public async findWorkflowByOpenAIModelName(teamId: string, openaiModelName: string) {
    return await this.workflowMetadataRepository.findOne({
      where: {
        teamId,
        openaiModelName,
        isDeleted: false,
      },
    });
  }

  public async hasWorkflowUnauthorized(workflowId: string) {
    const workflow = await this.workflowMetadataRepository.findOne({
      where: {
        workflowId,
        isDeleted: false,
      },
    });
    return {
      userId: workflow?.creatorUserId,
      notAuthorized: workflow?.notAuthorized,
    };
  }

  public async toggleWorkflowUnauthorized(teamId: string, workflowId: string, notAuthorized: boolean) {
    return await this.workflowMetadataRepository.update(
      {
        workflowId,
        teamId,
      },
      {
        notAuthorized,
      },
    );
  }

  public async checkWorkflowExists(workflowId: string, version?: number) {
    return (
      (await this.workflowMetadataRepository.findOne({
        where: {
          workflowId,
          isDeleted: false,
          ...(version && { version }),
        },
      })) !== null
    );
  }

  public async convertWorkflowWhitShortcutsFlowId(workflowOrWorkflowId: WorkflowMetadataEntity | string, version?: number, targetWorkflow = false) {
    let workflow: WorkflowMetadataEntity | null;

    if (typeof workflowOrWorkflowId === 'string') {
      if (!version) {
        version = await this.getMaxVersion(workflowOrWorkflowId);
      }
      workflow = await this.getWorkflowById(workflowOrWorkflowId, version);
    } else {
      workflow = workflowOrWorkflowId;
    }

    const shortcutsFlow = workflow?.shortcutsFlow;
    if (shortcutsFlow) {
      const [workflowId, versionString] = shortcutsFlow.split(':');
      if (!isEmpty(workflowId)) {
        let shortcutsFlowVersion = parseInt(versionString);
        if (!shortcutsFlowVersion) {
          shortcutsFlowVersion = await this.getMaxVersion(workflowId);
        }

        const targetFlow = await this.getWorkflowById(workflowId, shortcutsFlowVersion, false);
        if (targetFlow) {
          if (isEmpty(targetFlow?.shortcutsFlow ?? null)) {
            if (targetWorkflow) {
              return targetFlow;
            }

            const targetKeys = [
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
            ] as (keyof WorkflowMetadataEntity)[];

            return {
              ...omit(workflow, targetKeys),
              ...pick(targetFlow, targetKeys),
            } as WorkflowMetadataEntity;
          }
        }
      }
    }

    return null;
  }

  public async listGlobalWorkflowAssociations(teamId: string, detail = false): Promise<BaseWorkflowAssosciation[]> {
    return await this.globalWorkflowAssociationRepository
      .find({
        where: {
          isDeleted: false,
          teamId,
        },
        relations: {
          targetWorkflow: true,
        },
      })
      .then((data) => (detail ? data : data.map((item) => omit(item, ['targetWorkflow']))))
      .then((data) => data.map((item) => ({ ...item, scope: 'global' }) as BaseWorkflowAssosciation));
  }

  public async getGlobalWorkflowAssociation(workflowAssociationId: string, relation = true) {
    return await this.globalWorkflowAssociationRepository.findOne({
      where: { id: workflowAssociationId, isDeleted: false },
      relations: relation
        ? {
            targetWorkflow: true,
          }
        : undefined,
    });
  }

  public async createGlobalWorkflowAssociation(teamId: string, createAssociation: UpdateAndCreateGlobalWorkflowAssociations) {
    return await this.workflowAssociationRepository.manager.transaction(async (transactionalEntityManager) => {
      const workflows =
        createAssociation.type === 'to-workflow'
          ? await transactionalEntityManager.find(WorkflowMetadataEntity, {
              where: {
                id: In([createAssociation.targetWorkflowId]),
                isDeleted: false,
                teamId,
              },
            })
          : [];

      if (createAssociation.type !== 'to-workflow' && workflows.length !== 1) {
        throw new NotFoundException('targetWorkflowId not found, targetWorkflowId: ' + createAssociation.targetWorkflowId);
      }

      return await transactionalEntityManager.save(GlobalWorkflowAssociationsEntity, {
        ...pick(createAssociation, ['displayName', 'description', 'enabled', 'mapper', 'targetWorkflowId', 'iconUrl', 'sortIndex', 'type', 'extraData', 'preferAppId']),
        teamId,
        id: generateDbId(),
        isDeleted: false,
      });
    });
  }

  public async updateGlobalWorkflowAssociation(id: string, teamId: string, updateAssociation: UpdateAndCreateGlobalWorkflowAssociations) {
    return await this.workflowAssociationRepository.manager.transaction(async (transactionalEntityManager) => {
      const association = await transactionalEntityManager.findOne(GlobalWorkflowAssociationsEntity, {
        where: { id, isDeleted: false },
        relations: {
          targetWorkflow: true,
        },
      });

      if (!association) {
        throw new NotFoundException(`global workflow association not found: ${id}`);
      }

      if (association.type === 'to-workflow' && association.targetWorkflow.teamId !== teamId) {
        throw new ForbiddenException(`no permission to operate the global workflow association: ${id}`);
      }

      if (association.type === 'to-workflow' && updateAssociation.targetWorkflowId) {
        const workflow = await this.workflowMetadataRepository.findOne({
          where: {
            id: updateAssociation.targetWorkflowId,
            isDeleted: false,
            teamId,
          },
        });
        if (!workflow) {
          throw new NotFoundException(`targetWorkflowId not found: ${updateAssociation.targetWorkflowId}`);
        }
      }

      const updateFields = {
        ..._.pickBy(
          {
            displayName: updateAssociation.displayName,
            description: updateAssociation.description,
            enabled: updateAssociation.enabled,
            mapper: updateAssociation.mapper,
            targetWorkflowId: updateAssociation.targetWorkflowId,
            iconUrl: updateAssociation.iconUrl,
            sortIndex: updateAssociation.sortIndex,
            type: updateAssociation.type,
            extraData: updateAssociation.extraData,
            preferAppId: updateAssociation.preferAppId,
          },
          (v) => typeof v !== 'undefined',
        ),
        updatedTimestamp: Date.now(),
      };
      await transactionalEntityManager.update(GlobalWorkflowAssociationsEntity, { id, isDeleted: false }, updateFields);
      const updatedAssociation = await transactionalEntityManager.findOne(GlobalWorkflowAssociationsEntity, {
        where: { id, isDeleted: false },
        relations: {
          targetWorkflow: true,
        },
      });
      return updatedAssociation;
    });
  }

  public async removeGlobalWorkflowAssociation(id: string, teamId: string) {
    return await this.workflowAssociationRepository.manager.transaction(async (transactionalEntityManager) => {
      const association = await transactionalEntityManager.findOne(GlobalWorkflowAssociationsEntity, {
        where: { id, isDeleted: false },
        relations: {
          targetWorkflow: true,
        },
      });

      if (!association) {
        throw new NotFoundException(`global workflow association not found: ${id}`);
      }

      if (association.type === 'to-workflow' && association.targetWorkflow.teamId !== teamId) {
        throw new ForbiddenException(`no permission to operate the global workflow association: ${id}`);
      }

      await transactionalEntityManager.update(GlobalWorkflowAssociationsEntity, { id, isDeleted: false }, { isDeleted: true, updatedTimestamp: Date.now() });
      return { success: true };
    });
  }

  public async listAllWorkflowAssociations(teamId: string, detail = false) {
    const globalWorkflowAssociations = await this.listGlobalWorkflowAssociations(teamId, detail);
    const allWorkflowAssociations = await this.workflowAssociationRepository
      .find({
        where: {
          originWorkflow: {
            teamId,
          },
          isDeleted: false,
        },
        relations: {
          originWorkflow: true,
          targetWorkflow: true,
        },
      })
      .then((data) => (detail ? data : data.map((item) => omit(item, ['originWorkflow', 'targetWorkflow']))))
      .then((data) => data.map((item) => ({ ...item, scope: 'specific' }) as BaseWorkflowAssosciation));
    return [...globalWorkflowAssociations, ...allWorkflowAssociations];
  }

  public async listWorkflowAssociations(workflowId: string, teamId: string, detail = false): Promise<BaseWorkflowAssosciation[]> {
    const currentWorkflowAssociations = await this.workflowAssociationRepository
      .find({
        where: {
          originWorkflowId: workflowId,
          isDeleted: false,
          originWorkflow: {
            teamId,
          },
        },
        relations: {
          originWorkflow: true,
          targetWorkflow: true,
        },
      })
      .then((data) => (detail ? data : data.map((item) => omit(item, ['originWorkflow', 'targetWorkflow']))))
      .then((data) => data.map((item) => ({ ...item, scope: 'specific' }) as BaseWorkflowAssosciation));
    const globalWorkflowAssociations = await this.listGlobalWorkflowAssociations(teamId, detail);
    return [...globalWorkflowAssociations, ...currentWorkflowAssociations];
  }

  public async getWorkflowAssociation(workflowAssociationId: string, relation = true) {
    return await this.workflowAssociationRepository.findOne({
      where: { id: workflowAssociationId, isDeleted: false },
      relations: relation
        ? {
            originWorkflow: true,
            targetWorkflow: true,
          }
        : undefined,
    });
  }

  public async createWorkflowAssociation(workflowId: string, teamId: string, createAssociation: UpdateAndCreateWorkflowAssociation) {
    return await this.workflowAssociationRepository.manager.transaction(async (transactionalEntityManager) => {
      const workflows = await transactionalEntityManager.find(WorkflowMetadataEntity, {
        where: {
          id: createAssociation.type === 'to-workflow' ? In([workflowId, createAssociation.targetWorkflowId]) : In([workflowId]),
          isDeleted: false,
          teamId,
        },
      });

      if (createAssociation.type === 'to-workflow' && workflows.length !== 2) {
        throw new NotFoundException('originWorkflowId or targetWorkflowId not found, originWorkflowId: ' + workflowId + ', targetWorkflowId: ' + createAssociation.targetWorkflowId);
      }
      if (createAssociation.type !== 'to-workflow' && workflows.length !== 1) {
        throw new NotFoundException('originWorkflowId not found, originWorkflowId: ' + workflowId);
      }

      return await transactionalEntityManager.save(WorkflowAssociationsEntity, {
        ...pick(createAssociation, ['displayName', 'description', 'enabled', 'mapper', 'targetWorkflowId', 'iconUrl', 'sortIndex', 'type', 'extraData', 'preferAppId']),
        originWorkflowId: workflowId,
        id: generateDbId(),
        isDeleted: false,
      });
    });
  }

  public async updateWorkflowAssociation(id: string, teamId: string, updateAssociation: UpdateAndCreateWorkflowAssociation) {
    return await this.workflowAssociationRepository.manager.transaction(async (transactionalEntityManager) => {
      const association = await transactionalEntityManager.findOne(WorkflowAssociationsEntity, {
        where: { id, isDeleted: false },
        relations: {
          originWorkflow: true,
          targetWorkflow: true,
        },
      });

      if (!association) {
        throw new NotFoundException(`workflow association not found: ${id}`);
      }

      if (association.originWorkflow.teamId !== teamId || (association.type === 'to-workflow' && association.targetWorkflow.teamId !== teamId)) {
        throw new ForbiddenException(`no permission to operate the workflow association: ${id}`);
      }

      if (association.type === 'to-workflow' && updateAssociation.targetWorkflowId) {
        const workflow = await this.workflowMetadataRepository.findOne({
          where: {
            id: updateAssociation.targetWorkflowId,
            isDeleted: false,
            teamId,
          },
        });
        if (!workflow) {
          throw new NotFoundException(`targetWorkflowId not found: ${updateAssociation.targetWorkflowId}`);
        }
      }

      const updateFields = {
        ..._.pickBy(
          {
            displayName: updateAssociation.displayName,
            description: updateAssociation.description,
            enabled: updateAssociation.enabled,
            mapper: updateAssociation.mapper,
            targetWorkflowId: updateAssociation.targetWorkflowId,
            iconUrl: updateAssociation.iconUrl,
            sortIndex: updateAssociation.sortIndex,
            type: updateAssociation.type,
            extraData: updateAssociation.extraData,
            preferAppId: updateAssociation.preferAppId,
          },
          (v) => typeof v !== 'undefined',
        ),
        updatedTimestamp: Date.now(),
      };
      await transactionalEntityManager.update(WorkflowAssociationsEntity, { id, isDeleted: false }, updateFields);
      const updatedAssociation = await transactionalEntityManager.findOne(WorkflowAssociationsEntity, {
        where: { id, isDeleted: false },
        relations: {
          originWorkflow: true,
          targetWorkflow: true,
        },
      });
      return updatedAssociation;
    });
  }

  public async removeWorkflowAssociation(id: string, teamId: string) {
    return await this.workflowAssociationRepository.manager.transaction(async (transactionalEntityManager) => {
      const association = await transactionalEntityManager.findOne(WorkflowAssociationsEntity, {
        where: { id, isDeleted: false },
        relations: {
          originWorkflow: true,
          targetWorkflow: true,
        },
      });

      if (!association) {
        throw new NotFoundException(`workflow association not found: ${id}`);
      }

      if (association.originWorkflow.teamId !== teamId || (association.type === 'to-workflow' && association.targetWorkflow.teamId !== teamId)) {
        throw new ForbiddenException(`no permission to operate the workflow association: ${id}`);
      }

      await transactionalEntityManager.update(WorkflowAssociationsEntity, { id, isDeleted: false }, { isDeleted: true, updatedTimestamp: Date.now() });
      return { success: true };
    });
  }
}
