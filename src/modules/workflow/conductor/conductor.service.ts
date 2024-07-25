import { conductorClient } from '@/common/conductor';
import { config } from '@/common/config';
import { logger } from '@/common/logger';
import { InputParametersType } from '@/common/typings/workflow';
import { flatTasks } from '@/common/utils/conductor';
import { SYSTEM_NAMESPACE } from '@/database/entities/tools/tools-server.entity';
import { WorkflowMetadataEntity, WorkflowOutputValue } from '@/database/entities/workflow/workflow-metadata';
import { ToolsRepository } from '@/database/repositories/tools.repository';
import { DoWhileMode } from '@/modules/tools/conductor-system-tools/do-while';
import { CONDUCTOR_TASK_DEF_NAME } from '@/modules/tools/tools.polling.service';
import { Task, WorkflowTask } from '@inf-monkeys/conductor-javascript';
import { ToolType } from '@inf-monkeys/monkeys';
import { Injectable } from '@nestjs/common';

export interface WorkflowDefinition {
  ownerApp?: string;
  createTime?: number;
  updateTime?: number;
  createdBy?: string;
  updatedBy?: string;
  name: string;
  description?: string;
  version?: number;
  tasks: Array<WorkflowTask>;
  inputParameters?: Array<string>;
  outputParameters?: Record<string, any>;
  failureWorkflow?: string;
  schemaVersion?: number;
  restartable?: boolean;
  workflowStatusListenerEnabled?: boolean;
  ownerEmail?: string;
  timeoutPolicy?: 'TIME_OUT_WF' | 'ALERT_ONLY';
  timeoutSeconds: number;
  variables?: Record<string, any>;
  inputTemplate?: Record<string, any>;
}

@Injectable()
export class ConductorService {
  TOOL_NAME_KEY = '__toolName';
  CONTEXT_KEY = '__context';

  constructor(private readonly toolsRepository: ToolsRepository) {}

  public convertConductorTasksToVinesTasks(teamId: string, tasks: Task[], workflowDefinition: WorkflowDefinition) {
    // const team = await this.teamService.getTeamById(teamId);

    const flattedTasks = flatTasks(tasks);
    for (const task of flattedTasks) {
      const workflowTaskNamePrefix = config.conductor.workerPrefix;
      if (workflowTaskNamePrefix) {
        // 移除前缀
        if (task.taskDefName.startsWith(workflowTaskNamePrefix)) {
          task.taskDefName = task.taskDefName.replace(workflowTaskNamePrefix, '');
          task.taskType = task.taskType.replace(workflowTaskNamePrefix, '');
          if (task.workflowTask) {
            task.workflowTask.name = task.workflowTask.name.replace(workflowTaskNamePrefix, '');
          }
        }
      }
      // 将 conductor 里面的 api 转换成真实的 name
      if (task.inputData && task.inputData[this.TOOL_NAME_KEY]) {
        const realBlockName = task.inputData[this.TOOL_NAME_KEY];
        task.taskDefName = realBlockName;
        task.taskType = realBlockName;
        if (task.workflowTask) {
          task.workflowTask.name = realBlockName;
        }
      }

      delete task.inputData[this.TOOL_NAME_KEY];
      delete task.inputData[this.CONTEXT_KEY];
    }

    for (const task of flatTasks(workflowDefinition?.tasks) || []) {
      const workflowTaskNamePrefix = config.conductor.workerPrefix;
      if (workflowTaskNamePrefix) {
        // 移除前缀
        if (task.name.startsWith(workflowTaskNamePrefix)) {
          task.name = task.name.replace(workflowTaskNamePrefix, '');
          if (task.taskDefinition) {
            task.taskDefinition.name = task.taskDefinition.name.replace(workflowTaskNamePrefix, '');
          }
        }
      }
      // 将 conductor 里面的 api 转换成真实的 name
      if (task.inputParameters && task.inputParameters[this.TOOL_NAME_KEY]) {
        const realBlockName = task.inputParameters[this.TOOL_NAME_KEY];
        task.name = realBlockName;
        if (task.taskDefinition) {
          task.taskDefinition.name = realBlockName;
        }
      }
    }
  }

  private getJoinTaskJoinOn(taskReferenceName: string, tasks: WorkflowTask[]) {
    try {
      const joinTaskIndex = tasks.findIndex((x) => x.taskReferenceName === taskReferenceName);
      const forJoinTaskIndex = joinTaskIndex - 1;
      const forJoinTask = tasks[forJoinTaskIndex];
      const { forkTasks } = forJoinTask;
      return forkTasks.map((x) => x[x.length - 1].taskReferenceName);
    } catch (error) {
      logger.error('Get join task joinOn failed', error);
      return [];
    }
  }

  private async convertVinesTasksToConductorTasks(teamId: string, workflowOutput: WorkflowOutputValue[], tasks: WorkflowTask[], replaceWorkflowIdInOutputBlock?: { [x: string]: any }) {
    // const team = await this.teamService.getTeamById(teamId);
    if (workflowOutput && Array.isArray(workflowOutput) && workflowOutput.length > 0) {
      const inputParameters: InputParametersType = {
        [this.TOOL_NAME_KEY]: 'construct_workflow_output',
      };
      for (const item of workflowOutput) {
        const { key } = item;
        let { value } = item;
        if (replaceWorkflowIdInOutputBlock && Object.keys(replaceWorkflowIdInOutputBlock).length > 0) {
          if (typeof value === 'string') {
            const regex = /[a-f0-9]{24}/i;
            const originalWorkflowId = (value.match(regex) || [])[0];
            if (originalWorkflowId) {
              const newWorkflowId = replaceWorkflowIdInOutputBlock[originalWorkflowId];
              value = value.replaceAll(originalWorkflowId, newWorkflowId);
            }
          }
        }
        inputParameters[key] = value;
      }

      tasks.push({
        name: CONDUCTOR_TASK_DEF_NAME,
        taskReferenceName: 'construct_workflow_output_ref',
        type: ToolType.SIMPLE,
        inputParameters,
      });
    }

    // 将一个嵌套的 task 拍平
    const flattedTasks: WorkflowTask[] = flatTasks(tasks);
    const tools = await this.toolsRepository.listTools(teamId);
    for (const task of flattedTasks) {
      if (!task.inputParameters) {
        task.inputParameters = {};
      }

      const tool = tools.find((x) => x.name === task.name);
      if (!tool) {
        continue;
      }

      if (tool.namespace !== SYSTEM_NAMESPACE || task.type === ToolType.SIMPLE) {
        // use CUSTOM_BLOCK_NAME_KEY to store real task_name
        task.inputParameters[this.TOOL_NAME_KEY] = task.name;
        task.inputParameters[this.CONTEXT_KEY] = '${workflow.input.__context}';
        task.name = CONDUCTOR_TASK_DEF_NAME;
      }

      // 循环 block 的列表循环模式
      if (task.type === 'DO_WHILE') {
        const { mode = DoWhileMode.Expression, loopCount = 0 } = task.inputParameters;
        if (mode === DoWhileMode.Fixed) {
          // 直接输入数字的情况
          if (typeof loopCount === 'number') {
            if (loopCount < 2) {
              throw new Error('固定次数循环模式的循环次数必须大于 1');
            }
            task.loopCondition = `if ($.${task.taskReferenceName}['iteration'] < '${loopCount}') { true; } else { false; }`;
          }
          // 输入装配表达式的情况
          else if (typeof loopCount === 'string' && loopCount.trim().startsWith('${')) {
            task.loopCondition = `if ($.${task.taskReferenceName}['iteration'] < $.loopCount) { true; } else { false; }`;
          } else {
            throw new Error('不合法的循环次数配置');
          }
          delete task.inputParameters.listToLoopOver;
        } else if (mode === DoWhileMode.List) {
          let { listToLoopOver } = task.inputParameters;
          if (!listToLoopOver) {
            throw new Error('列表循环模式传入的列表不能为空');
          }
          listToLoopOver = listToLoopOver.trim();
          const listToLoopOverLength = `$\{${listToLoopOver.slice(2, listToLoopOver.length - 1)}.length()}`;
          const inlineTask: WorkflowTask = {
            name: 'loopItemRef',
            taskReferenceName: `${task.taskReferenceName}_loopItemRef`,
            type: ToolType.INLINE,
            inputParameters: {
              evaluatorType: 'javascript',
              items: listToLoopOver,
              itemsLength: listToLoopOverLength,
              loopIndex: `$\{${task.taskReferenceName}.output.iteration\}`,
              expression: `$.itemsLength > 0 && (($.loopIndex || 1) - 1) < $.itemsLength  ? $.items.get(($.loopIndex || 1) - 1) : null`,
            },
          };
          if (!task.loopOver) {
            task.loopOver = [];
          }
          if (task.loopOver[0]?.type === 'INLINE') {
            task.loopOver.splice(0, 1, inlineTask);
          } else {
            task.loopOver = [inlineTask].concat(task.loopOver);
          }

          task.inputParameters.itemsLength = listToLoopOverLength;
          task.loopCondition = `if ($.${task.taskReferenceName}['iteration'] < $.itemsLength) { true; } else { false; } `;
        } else if (mode === DoWhileMode.Expression) {
          if (!task.loopCondition) {
            if (!task.inputParameters.loopCondition) {
              throw new Error('表达式模式传入的表达式不能为空');
            } else {
              task.loopCondition = task.inputParameters.loopCondition;
            }
            delete task.inputParameters.listToLoopOver;
          }
        }
      }

      if (task.type === ToolType.JOIN) {
        task.joinOn = this.getJoinTaskJoinOn(task.taskReferenceName, tasks);
      }

      // TODO
      // const prefix = team?.workflowTaskNamePrefix || config.conductor.workerPrefix;
      // if (prefix) {
      //   task.name = `${prefix}${task.name}`;
      // }
    }
  }

  public async saveWorkflowInConductor(workflowEntity: WorkflowMetadataEntity) {
    const { tasks, teamId, workflowId, version, output } = workflowEntity;

    try {
      await this.convertVinesTasksToConductorTasks(teamId, output, tasks, {});
      const res = await conductorClient.metadataResource.update(
        [
          {
            name: workflowId,
            description: workflowEntity.getDisplayNameStr(),
            version: version,
            restartable: true,
            workflowStatusListenerEnabled: true,
            schemaVersion: 2,
            ownerEmail: 'dev@inf-monkeys.com',
            timeoutPolicy: 'TIME_OUT_WF',
            timeoutSeconds: 60 * 60 * 24,
            tasks,
          },
        ],
        true,
      );
      if (!res.bulkSuccessfulResults?.length) {
        throw new Error('Save workflow in conductor failed');
      }
    } catch (error) {
      const message = JSON.stringify(error.body.validationErrors);
      throw new Error(message);
    }
  }

  public async getWorkflowExecutionStatus(teamId: string, workflowInstanceId: string) {
    const data = await conductorClient.workflowResource.getExecutionStatus(workflowInstanceId, true, true);
    this.convertConductorTasksToVinesTasks(teamId, (data.tasks || []) as Task[], data.workflowDefinition);
    return data;
  }
}
