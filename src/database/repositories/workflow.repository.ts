import { ListDto } from '@/common/dto/list.dto';
import { getNextCronTimestamp } from '@/common/utils/cron';
import { calcMd5 } from '@/common/utils/utils';
import { WorkflowChatSessionEntity } from '@/database/entities/workflow/workflow-chat-session';
import { WorkflowExecutionEntity } from '@/database/entities/workflow/workflow-execution';
import { WorkflowMetadataEntity, WorkflowOutputValue, WorkflowValidationIssue } from '@/database/entities/workflow/workflow-metadata';
import { WorkflowTriggerType, WorkflowTriggersEntity } from '@/database/entities/workflow/workflow-trigger';
import { BlockDefProperties, MonkeyTaskDefTypes } from '@inf-monkeys/vines';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import _ from 'lodash';
import { ObjectId } from 'mongodb';
import { In, Repository } from 'typeorm';
import { WorkflowAssetRepositroy } from './assets-workflow.respository';

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
    private readonly workflowAssetRepositroy: WorkflowAssetRepositroy,
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
      name: string;
      description?: string;
      iconUrl?: string;
      tasks: MonkeyTaskDefTypes[];
      variables?: BlockDefProperties[];
      output: WorkflowOutputValue[];
    },
  ) {
    const { name, description, iconUrl, tasks, variables, output } = data;
    await this.workflowMetadataRepository.save({
      id: new ObjectId(),
      createdTimestamp: Date.now(),
      updatedTimestamp: Date.now(),
      isDeleted: false,
      workflowId,
      version,
      teamId: teamId,
      creatorUserId: userId,
      name,
      description,
      iconUrl,
      tasks,
      variables,
      output,
    });
    return await this.getWorkflowById(workflowId, version);
  }

  public async getWorkflowById(workflowId: string, version: number) {
    return await this.workflowMetadataRepository.findOne({
      where: {
        workflowId,
        version,
        isDeleted: false,
      },
    });
  }

  public async findWorkflowByIds(ids: string[]) {
    if (!ids?.length) {
      return [];
    }
    return await this.workflowMetadataRepository.find({
      where: {
        id: In(ids.map((id) => new ObjectId(id))),
        isDeleted: false,
      },
    });
  }

  public async getAllWorkflowsInTeam(teamId: string) {
    return await this.workflowMetadataRepository.find({
      where: {
        teamId,
        isDeleted: true,
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
      name?: string;
      description?: string;
      iconUrl?: string;
      tasks?: MonkeyTaskDefTypes[];
      variables?: BlockDefProperties[];
      activated?: boolean;
      validated?: boolean;
      validationIssues?: WorkflowValidationIssue[];
      output?: WorkflowOutputValue[];
      tagIds?: string[];
    },
  ) {
    const { name, description, iconUrl, tasks, variables, activated, validationIssues, validated, output, tagIds } = updates;

    // 字段都为空，则跳过更新
    if ([name, description, iconUrl, tasks, variables, activated, validated, validationIssues, output, tagIds].every((item) => typeof item === 'undefined')) return;
    if (variables && !Array.isArray(variables)) {
      throw new Error('variables 字段必须为数组');
    }
    if (output && !Array.isArray(output)) {
      throw new Error('output 字段必须为数组');
    }
    await this.workflowMetadataRepository.findOneOrFail({ where: { workflowId: workflowId, version, teamId, isDeleted: false } });
    await this.workflowMetadataRepository.update(
      { workflowId, isDeleted: false, teamId, version },
      {
        ..._.pickBy({ name, iconUrl, description, tasks, variables, activated, validationIssues, validated, output, tagIds }, (v) => typeof v !== 'undefined'),
        updatedTimestamp: Date.now(),
      },
    );
    const workflow = await this.workflowMetadataRepository.findOne({
      where: {
        teamId,
        workflowId,
        version,
        isDeleted: false,
      },
    });
    const md5 = this.calcWorkflowMd5(workflow);
    workflow.md5 = md5;
    await this.workflowMetadataRepository.save(workflow);
    return workflow;
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
    await this.workflowMetadataRepository.update(
      {
        teamId,
        workflowId,
      },
      {
        isDeleted: true,
      },
    );
    await this.workflowTriggerRepository.update(
      {
        workflowId,
      },
      {
        isDeleted: true,
      },
    );
  }

  public async getWorklfowVersions(workflowId: string) {
    const versions = await this.workflowMetadataRepository.find({
      where: {
        workflowId,
        isDeleted: false,
      },
    });
    return versions;
  }

  public async getMaxVersion(teamId: string, workflowId: string) {
    const versions = await this.workflowMetadataRepository.find({
      where: {
        teamId,
        workflowId,
      },
    });
    if (versions?.length === 0) {
      return 1;
    }
    const maxVersion = Math.max(...versions.map((x) => x.version));
    return maxVersion;
  }

  public async findWebhookTrigger(webhookPath: string) {
    return await this.workflowTriggerRepository.findOne({
      where: {
        type: WorkflowTriggerType.WEBHOOK,
        webhookPath,
      },
    });
  }

  public async saveWorkflowExecution(workflowId: string, version: number, workflowInstanceId: string, userId: string, triggerType: WorkflowTriggerType, chatSessionId: string) {
    await this.workflowExecutionRepository.save({
      id: new ObjectId(),
      createdTimestamp: Date.now(),
      updatedTimestamp: Date.now(),
      isDeleted: false,
      workflowId,
      workflowVersion: version,
      workflowInstanceId,
      userId,
      triggerType,
      chatSessionId,
    });
  }

  public async deleteTrigger(workflowId: string, triggerId: string) {
    return await this.workflowTriggerRepository.update(
      {
        id: new ObjectId(triggerId),
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

  public async getWorkflowTrigger(workflowId: string, triggerId: string) {
    const trigger = await this.workflowTriggerRepository.findOne({
      where: {
        workflowId,
        id: new ObjectId(triggerId),
      },
    });
    return trigger;
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
      .andWhere('(workflow_trigger.next_trigger_time IS NULL OR workflow_trigger.next_trigger_time < :currentTimestamp)', { currentTimestamp })
      .andWhere('workflow_trigger.is_deleted = :isDeleted', { isDeleted: false });
    const triggersToRun = await query.getMany();
    return triggersToRun;
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
    const id = new ObjectId();
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
    });
  }

  public async deleteChatSession(teamId: string, sessionId: string) {
    await this.workflowChatSessionRepository.update(
      {
        id: new ObjectId(sessionId),
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
        id: new ObjectId(sessionId),
        teamId,
        isDeleted: false,
      },
      updates,
    );
    return {
      success: true,
    };
  }

  public async listWorkflows(
    teamId: string,
    dto: ListDto,
  ): Promise<{
    totalCount: number;
    list: WorkflowMetadataEntity[];
  }> {
    const { page = 1, limit = 24, orderBy = 'DESC', orderColumn = 'createdTimestamp', filter } = dto;
    let workflowIdsConstraints = [];
    if (filter) {
      workflowIdsConstraints = await this.workflowAssetRepositroy.findAssetIdsByCommonFilter('workflow', filter, 'workflowId');
      if (!workflowIdsConstraints.length) {
        return {
          totalCount: 0,
          list: [],
        };
      }
    }

    let orderColumnName = '';
    switch (orderColumn) {
      case 'createdTimestamp':
        orderColumnName = 'created_timestamp';
        break;
      case 'updatedTimestamp':
        orderColumnName = 'updated_timestamp';
        break;
      default:
        orderColumnName = 'created_timestamp';
        break;
    }
    let orderByName = 'DESC';
    let orderByNumber = -1;
    switch (orderBy) {
      case 'DESC':
        orderByName = 'DESC';
        orderByNumber = -1;
        break;
      case 'ASC':
        orderByName = 'ASC';
        orderByNumber = 1;
        break;
      default:
        orderByName = 'DESC';
        orderByNumber = -1;
        break;
    }
    const where = workflowIdsConstraints.length
      ? `
is_deleted = false
AND team_id = $1
AND workflow_id in (${workflowIdsConstraints.map((x) => `'${x}'`)})
    `
      : `
is_deleted = false
AND team_id = $1
      `;
    const totalCountSql = `
SELECT 
    COUNT(iw.workflow_id)
FROM 
    public.infmonkeys_workflow_metadatas iw
INNER JOIN (
    SELECT 
        workflow_id, 
        MAX(version) AS max_version
    FROM 
        public.infmonkeys_workflow_metadatas
    WHERE 
        ${where}
    GROUP BY 
        workflow_id
) mv ON iw.workflow_id = mv.workflow_id AND iw.version = mv.max_version;
    `;
    const totalCountRes = await this.workflowMetadataRepository.query(totalCountSql, [teamId]);
    const totalCount = totalCountRes[0]['count'];
    const sql = `
SELECT 
    iw.workflow_id
FROM 
    public.infmonkeys_workflow_metadatas iw
INNER JOIN (
    SELECT 
        workflow_id, 
        MAX(version) AS max_version
    FROM 
        public.infmonkeys_workflow_metadatas
    WHERE 
        ${where}
    GROUP BY 
        workflow_id
) mv ON iw.workflow_id = mv.workflow_id AND iw.version = mv.max_version
ORDER BY 
    iw.${orderColumnName} ${orderByName}
LIMIT $2 OFFSET $3;
    `;
    const res = await this.workflowMetadataRepository.query(sql, [teamId, limit, (page - 1) * limit]);
    const workflowIds: string[] = res.map((x) => x.workflow_id);
    const workflows = await this.workflowMetadataRepository.find({
      where: {
        id: In(workflowIds.map((x) => new ObjectId(x))),
      },
      order: {
        [orderColumn]: orderByNumber,
      },
    });
    return {
      totalCount,
      list: workflows,
    };
  }
}