import { conductorClient } from '@/common/conductor';
import { InputParametersType } from '@/common/typings/workflow';
import { flatTasks } from '@/common/utils/conductor';
import { WorkflowMetadataEntity, WorkflowOutputValue } from '@/entities/workflow/workflow';
import { ToolsRepository } from '@/modules/infra/database/repositories/tools.repository';
import { DoWhileMode } from '@/modules/tools/built-in-tools/do-while';
import { CONDUCTOR_TASK_DEF_NAME } from '@/modules/tools/tools.polling.service';
import { BlockType } from '@inf-monkeys/vines';
import { Task, WorkflowTask } from '@io-orkes/conductor-javascript';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ConductorService {
  CUSTOM_BLOCK_NAME_KEY = '__customBlockName';
  EXTRA_KEY = '__extra';

  constructor(private readonly toolsRepository: ToolsRepository) {}

  private async convertConductorTasksToVinesTasks(teamId: string, tasks: Task[]) {
    // const team = await this.teamService.getTeamById(teamId);

    for (const task of tasks) {
      // const workflowTaskNamePrefix = team?.workflowTaskNamePrefix || config.conductor.workerPrefix;
      // if (workflowTaskNamePrefix) {
      //   // 移除前缀
      //   if (task.taskDefName.startsWith(workflowTaskNamePrefix)) {
      //     task.taskDefName = task.taskDefName.replace(workflowTaskNamePrefix, '');
      //     task.taskType = task.taskType.replace(workflowTaskNamePrefix, '');
      //     if (task.workflowTask) {
      //       task.workflowTask.name = task.workflowTask.name.replace(workflowTaskNamePrefix, '');
      //     }
      //   }
      // }
      // 将 conductor 里面的 api 转换成真实的 name
      if (task.inputData && task.inputData[this.CUSTOM_BLOCK_NAME_KEY]) {
        const realBlockName = task.inputData[this.CUSTOM_BLOCK_NAME_KEY];
        task.taskDefName = realBlockName;
        task.taskType = realBlockName;
        if (task.workflowTask) {
          task.workflowTask.name = realBlockName;
        }
      }
    }
  }

  private async convertVinesTasksToConductorTasks(teamId: string, workflowOutput: WorkflowOutputValue[], tasks: WorkflowTask[], replaceWorkflowIdInOutputBlock?: { [x: string]: any }) {
    // const team = await this.teamService.getTeamById(teamId);

    if (workflowOutput && Array.isArray(workflowOutput) && workflowOutput.length > 0) {
      const inputParameters: InputParametersType = {};
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
        name: 'construct_value',
        taskReferenceName: 'construct_value_ref',
        type: BlockType.SIMPLE,
        inputParameters,
      });
    }

    // 将一个嵌套的 task 拍平
    const flattedTasks: WorkflowTask[] = flatTasks(tasks);
    const tools = await this.toolsRepository.listTools();
    for (const task of flattedTasks) {
      if (!task.inputParameters) {
        task.inputParameters = {};
      }

      const tool = tools.find((x) => x.name === task.name);
      // use CUSTOM_BLOCK_NAME_KEY to store real task_name
      task.inputParameters[this.CUSTOM_BLOCK_NAME_KEY] = task.name;
      task.inputParameters[this.EXTRA_KEY] = tool.extra;
      task.name = CONDUCTOR_TASK_DEF_NAME;

      // 特殊类型的 block：SUB_WORKFLOW
      if (task.type === 'SUB_WORKFLOW') {
        const { name, version, parameters } = task.inputParameters;
        task.inputParameters = parameters || {};
        task.subWorkflowParam = task.subWorkflowParam || {
          name,
          version,
        };
      }

      // 特殊类型的 block: SWITCH
      if (task.type === 'SWITCH') {
        const { parameters } = task.inputParameters;
        task.inputParameters = parameters;
      }

      // https://conductor.netflix.com/documentation/configuration/workflowdef/operators/set-variable-task.html
      if (task.type === BlockType.SET_VARIABLE) {
        const { parameters } = task.inputParameters;
        task.inputParameters = parameters;
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
            task.loopCondition = `if ($.${task.taskReferenceName}['iteration'] < ${loopCount}) { true; } else { false; }`;
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
            type: BlockType.INLINE,
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

      // TODO
      // const prefix = team?.workflowTaskNamePrefix || config.conductor.workerPrefix;
      // if (prefix) {
      //   task.name = `${prefix}${task.name}`;
      // }
    }
  }

  public async saveWorkflowInConductor(workflowEntity: WorkflowMetadataEntity) {
    const { workflowDef, teamId, workflowId, desc, version, output } = workflowEntity;
    const { tasks } = workflowDef;
    await this.convertVinesTasksToConductorTasks(teamId, output, tasks, {});
    await conductorClient.metadataResource.create({
      name: workflowId,
      description: desc,
      version: version,
      restartable: true,
      workflowStatusListenerEnabled: true,
      schemaVersion: 2,
      ownerEmail: 'dev@inf-monkeys.com',
      timeoutPolicy: 'TIME_OUT_WF',
      timeoutSeconds: 60 * 60 * 24,
      tasks,
    });
  }

  public async getWorkflowExecutionStatus(teamId: string, workflowInstanceId: string) {
    const data = await conductorClient.workflowResource.getExecutionStatus(workflowInstanceId);
    await this.convertConductorTasksToVinesTasks(teamId, (data.tasks || []) as Task[]);
    return data;
  }
}
