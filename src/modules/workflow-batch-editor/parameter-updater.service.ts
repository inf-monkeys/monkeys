import { Injectable, Logger } from '@nestjs/common';
import { WorkflowMetadataEntity } from '@/database/entities/workflow/workflow-metadata';
import { ParameterUpdateOperation, ParameterUpdateMode } from './dto/batch-update-params.dto';
import _ from 'lodash';

/**
 * 参数更新服务
 * 负责修改工作流的参数值
 */
@Injectable()
export class ParameterUpdaterService {
  private readonly logger = new Logger(ParameterUpdaterService.name);

  /**
   * 应用参数更新到工作流
   * @returns 修改后的工作流和变更详情
   */
  updateWorkflowParameters(
    workflow: WorkflowMetadataEntity,
    updates: ParameterUpdateOperation[],
    toolFilter?: { toolName?: string; toolNamespace?: string },
  ): {
    updatedWorkflow: WorkflowMetadataEntity;
    changes: Array<{
      taskReferenceName: string;
      taskDisplayName: string;
      parameterName: string;
      before: any;
      after: any;
    }>;
  } {
    const changes: Array<{
      taskReferenceName: string;
      taskDisplayName: string;
      parameterName: string;
      before: any;
      after: any;
    }> = [];

    // 深拷贝工作流，避免修改原对象
    const updatedWorkflow = _.cloneDeep(workflow);

    if (!updatedWorkflow.tasks || updatedWorkflow.tasks.length === 0) {
      this.logger.warn(`工作流 ${workflow.workflowId} 没有任务`);
      return { updatedWorkflow, changes };
    }

    // 遍历所有任务
    updatedWorkflow.tasks = updatedWorkflow.tasks.map((task: any) => {
      // 检查是否应该更新此任务
      const shouldUpdate = this.shouldUpdateTask(task, toolFilter);
      if (!shouldUpdate) {
        return task;
      }

      // 应用所有参数更新
      updates.forEach((update) => {
        // 如果指定了目标任务，只更新匹配的任务
        if (update.targetTaskReferenceName && task.taskReferenceName !== update.targetTaskReferenceName) {
          return;
        }

        // 获取当前参数值
        const currentValue = task.inputParameters?.[update.parameterName];

        // 根据模式决定是否更新
        let shouldApplyUpdate = false;
        let newValue = update.newValue;

        switch (update.mode) {
          case ParameterUpdateMode.OVERRIDE:
            // 覆盖模式：总是更新
            shouldApplyUpdate = true;
            break;

          case ParameterUpdateMode.DEFAULT:
            // 默认模式：只在未设置时更新
            shouldApplyUpdate = currentValue === undefined || currentValue === null || currentValue === '';
            break;

          case ParameterUpdateMode.MERGE:
            // 合并模式：用于对象类型
            if (typeof currentValue === 'object' && typeof update.newValue === 'object') {
              shouldApplyUpdate = true;
              newValue = { ...currentValue, ...update.newValue };
            } else {
              shouldApplyUpdate = true;
            }
            break;
        }

        if (shouldApplyUpdate) {
          // 确保 inputParameters 存在
          if (!task.inputParameters) {
            task.inputParameters = {};
          }

          // 记录变更
          changes.push({
            taskReferenceName: task.taskReferenceName,
            taskDisplayName: this.getTaskDisplayName(task),
            parameterName: update.parameterName,
            before: _.cloneDeep(currentValue),
            after: _.cloneDeep(newValue),
          });

          // 应用更新
          task.inputParameters[update.parameterName] = newValue;

          this.logger.debug(
            `更新任务 ${task.taskReferenceName} 的参数 ${update.parameterName}: ${JSON.stringify(currentValue)} -> ${JSON.stringify(newValue)}`,
          );
        }
      });

      return task;
    });

    // 版本号递增
    updatedWorkflow.version = (workflow.version || 0) + 1;

    this.logger.log(`工作流 ${workflow.workflowId} 应用了 ${changes.length} 个参数修改`);

    return { updatedWorkflow, changes };
  }

  /**
   * 重命名工作流显示名称
   */
  renameWorkflow(
    workflow: WorkflowMetadataEntity,
    renamePattern: {
      search: string;
      replace: string;
      useRegex?: boolean;
      caseSensitive?: boolean;
    },
  ): {
    updatedWorkflow: WorkflowMetadataEntity;
    oldDisplayName: any;
    newDisplayName: any;
  } {
    const updatedWorkflow = _.cloneDeep(workflow);
    const oldDisplayName = _.cloneDeep(workflow.displayName);

    // 构建正则表达式或字符串替换
    let searchPattern: string | RegExp;
    if (renamePattern.useRegex) {
      const flags = renamePattern.caseSensitive ? 'g' : 'gi';
      searchPattern = new RegExp(renamePattern.search, flags);
    } else {
      searchPattern = renamePattern.search;
    }

    // 分别处理中英文名称
    if (typeof updatedWorkflow.displayName === 'string') {
      // 兼容旧格式（纯字符串）
      if (renamePattern.useRegex) {
        updatedWorkflow.displayName = (updatedWorkflow.displayName as string).replace(
          searchPattern as RegExp,
          renamePattern.replace,
        );
      } else {
        updatedWorkflow.displayName = this.replaceAll(
          updatedWorkflow.displayName as string,
          searchPattern as string,
          renamePattern.replace,
          !renamePattern.caseSensitive,
        );
      }
    } else if (typeof updatedWorkflow.displayName === 'object') {
      // 新格式（I18nValue）
      const displayName = updatedWorkflow.displayName as any;
      if (displayName.en) {
        if (renamePattern.useRegex) {
          displayName.en = displayName.en.replace(searchPattern as RegExp, renamePattern.replace);
        } else {
          displayName.en = this.replaceAll(
            displayName.en,
            searchPattern as string,
            renamePattern.replace,
            !renamePattern.caseSensitive,
          );
        }
      }
      if (displayName.zh) {
        if (renamePattern.useRegex) {
          displayName.zh = displayName.zh.replace(searchPattern as RegExp, renamePattern.replace);
        } else {
          displayName.zh = this.replaceAll(
            displayName.zh,
            searchPattern as string,
            renamePattern.replace,
            !renamePattern.caseSensitive,
          );
        }
      }
    }

    // 版本号递增
    updatedWorkflow.version = (workflow.version || 0) + 1;

    this.logger.log(
      `工作流 ${workflow.workflowId} 重命名: ${JSON.stringify(oldDisplayName)} -> ${JSON.stringify(updatedWorkflow.displayName)}`,
    );

    return {
      updatedWorkflow,
      oldDisplayName,
      newDisplayName: updatedWorkflow.displayName,
    };
  }

  /**
   * 判断是否应该更新此任务
   */
  private shouldUpdateTask(
    task: any,
    toolFilter?: { toolName?: string; toolNamespace?: string },
  ): boolean {
    // 如果没有工具过滤，更新所有任务
    if (!toolFilter || (!toolFilter.toolName && !toolFilter.toolNamespace)) {
      return true;
    }

    // 检查任务名称是否匹配
    const taskName = task.name || '';
    const toolFullName = toolFilter.toolNamespace
      ? `${toolFilter.toolNamespace}:${toolFilter.toolName || ''}`
      : toolFilter.toolName || '';

    return taskName.includes(toolFullName);
  }

  /**
   * 获取任务显示名称
   */
  private getTaskDisplayName(task: any): string {
    if (!task.displayName) {
      return task.taskReferenceName || task.name || 'Unknown Task';
    }

    if (typeof task.displayName === 'string') {
      return task.displayName;
    }

    // I18nValue 格式
    return task.displayName.zh || task.displayName.en || task.taskReferenceName;
  }

  /**
   * 字符串全局替换（支持大小写不敏感）
   */
  private replaceAll(str: string, search: string, replace: string, caseInsensitive: boolean): string {
    if (caseInsensitive) {
      const regex = new RegExp(this.escapeRegExp(search), 'gi');
      return str.replace(regex, replace);
    } else {
      return str.split(search).join(replace);
    }
  }

  /**
   * 转义正则表达式特殊字符
   */
  private escapeRegExp(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
