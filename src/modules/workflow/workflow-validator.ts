import { extractDependencies } from '@/common/utils/code';
import { flatTasks } from '@/common/utils/conductor';
import { getI18NValue } from '@/common/utils/i18n';
import { ValidationIssueType, ValidationReasonType, WorkflowOutputValue, WorkflowValidationIssue } from '@/database/entities/workflow/workflow-metadata';
import { WorkflowTask } from '@inf-monkeys/conductor-javascript';
import { ToolDef, ToolProperty, ToolPropertyOptions, ToolPropertyTypes, ToolType } from '@inf-monkeys/monkeys';
import _ from 'lodash';

export const WORKFLOW_EXPRESSION_REGEX = /\$\{([a-zA-Z0-9_.\*\[\]\@\?\'\$\(\)\*]+)(?:\(\))?}/g;

export class WorkflowValidator {
  private static WORKFLOW_NAME = 'workflow';
  private static LOOP_ITEM_REF = '_loopItemRef';
  private static INGNORE_CHECK_PROP_TYPES: ToolPropertyTypes[] = ['notice'];

  private static isDateTime(value: any) {
    return value instanceof Date || !isNaN(Date.parse(value));
  }

  private static isExpression(value: any) {
    const stringifiedValue = typeof value === 'string' ? value : JSON.stringify(value);
    const matches = (stringifiedValue as string).match(WORKFLOW_EXPRESSION_REGEX);
    return matches;
  }

  private static isValidOption(options: ToolPropertyOptions[], value: string) {
    const validOptions = options?.map((x) => x.value) || [];
    return validOptions.includes(value);
  }

  private static validateToolInputParameterDataType(proprity: ToolProperty, value: any) {
    const { type, options, typeOptions } = proprity;
    switch (type) {
      case 'boolean':
        return typeof value === 'boolean';
      case 'string':
        if (proprity.name === 'model') {
          return true;
        } else if (!typeOptions?.multipleValues) {
          return typeof value === 'string';
        } else {
          return Array.isArray(value) && _.every(value, (item) => typeof item === 'string');
        }
      case 'number':
        return typeof value === 'number';
      case 'json':
        return (typeof value === 'object' && value !== null) || Array.isArray(value);
      case 'options':
        return this.isValidOption(options as ToolPropertyOptions[], value);
      default:
        return true;
    }
  }

  private static getToolPropValue(task: WorkflowTask, name: string) {
    const { inputParameters } = task;
    let value = undefined;
    switch (task.type) {
      // DO_WHILE 节点只需要配置了 loopCondition 就行，后面再做更细粒度的控制
      case ToolType.DO_WHILE:
        const { loopCondition } = task;
        if (name === 'loopCondition') {
          value = loopCondition;
        } else {
          value = inputParameters[name];
        }
        break;
      case ToolType.SIMPLE:
        value = inputParameters[name];
        break;
      default:
        value = inputParameters[name];
        break;
    }
    return value;
  }

  /**
   * 判断一个 prop 是否必填：
   * 需要同时判断 required 和 displayOptions 两个属性
   *
   * 针对非必填有两种情况：
   * 1. required 为 false，这种情况下如果填了，还是需要检测类型的
   * 2. required 为 true，但是 displayOptions 条件不满足，这种情况下就不需要再检测类型
   *
   */
  private static isPropRequiredAndCanSkipCheck(
    task: WorkflowTask,
    proprity: ToolProperty,
  ): {
    required: boolean;
    canSkipCheck: boolean;
  } {
    const { required, displayOptions } = proprity;
    if (!displayOptions) {
      return {
        required,
        canSkipCheck: false,
      };
    }
    const { show, hide } = displayOptions;

    if (hide) {
      const matched = _.every(Object.keys(hide), (key) => {
        const otherValues = hide[key];
        const currentOtherValue = this.getToolPropValue(task, key);
        return otherValues?.includes(currentOtherValue);
      });
      return {
        required: required ? !matched : false,
        canSkipCheck: true,
      };
    } else if (show) {
      // 全部匹配 show 的条件
      const matched = _.every(Object.keys(show), (key) => {
        const otherValues = show[key];
        const currentOtherValue = this.getToolPropValue(task, key);
        return otherValues?.includes(currentOtherValue);
      });
      return {
        required: required ? matched : false,
        canSkipCheck: true,
      };
    } else {
      return {
        required,
        canSkipCheck: true,
      };
    }
  }

  private static validateToolSpecificIssues(task: WorkflowTask, tool: ToolDef) {
    const issues: WorkflowValidationIssue[] = [];

    const { rules = [] } = tool;
    if (!rules) {
      return issues;
    }
    for (const rule of rules) {
      const { type } = rule;

      switch (type) {
        case 'CHECK_SOURCE_CODE_DEPENDENCY':
          const { sourceCode } = task.inputParameters;
          const avaliableModules = tool.extra?.avaliableModules || [];
          if (avaliableModules.length) {
            const usedDependencies = extractDependencies(sourceCode);
            const invalidDepencencies = _.filter(usedDependencies, (dep) => !avaliableModules.includes(dep));
            if (invalidDepencencies.length) {
              issues.push({
                taskReferenceName: task.taskReferenceName,
                issueType: ValidationIssueType.WANRING,
                detailReason: {
                  type: ValidationReasonType.CODE_INVALID_MODULE,
                  name: 'sourceCode',
                  detailInfomation: {
                    avaliableModules,
                    invalidDepencencies,
                  },
                },
                humanMessage: {
                  en: `自定义代码中引入的 ${invalidDepencencies.join(',')} 依赖不支持，运行可能出错。`,
                  zh: `The following depencencies used in your source code are not supported currently: ${invalidDepencencies.join(',')}, which may result in error.`,
                },
              });
            }
          }
          break;

        default:
          break;
      }
    }
    return issues;
  }

  private static validateToolInputParameter(tasks: WorkflowTask[], task: WorkflowTask, block: ToolDef, proprity: ToolProperty): WorkflowValidationIssue {
    const { name, type, displayName } = proprity;
    if (this.INGNORE_CHECK_PROP_TYPES.includes(type)) {
      return null;
    }
    const { taskReferenceName } = task;
    let issue: WorkflowValidationIssue = null;
    const value = this.getToolPropValue(task, name);

    // 检测必填规则
    const { required, canSkipCheck } = this.isPropRequiredAndCanSkipCheck(task, proprity);
    if (required) {
      if (value === undefined || value === null) {
        issue = {
          taskReferenceName,
          issueType: ValidationIssueType.ERROR,
          humanMessage: {
            en: `Properity ${getI18NValue(displayName, 'en-US')} is required.`,
            zh: `${getI18NValue(displayName, 'zh-CN')}必填参数未配置`,
          },
          detailReason: {
            name: name,
            type: ValidationReasonType.VALUE_REQUIRED,
          },
        };
      }
    }

    if (!issue && value && !canSkipCheck) {
      const matches = this.isExpression(value);
      if (matches) {
        // 校验引用数据
        // 需要检测到装配其他 block 类型的场景，比如一个 number 类型的输入，可能 value 是 ${some_block_ref.output.value} （字符串类型）
        for (const match of matches) {
          const referencedTaskName = match.slice(2).split('.')[0];
          if (referencedTaskName !== this.WORKFLOW_NAME && !referencedTaskName.includes(this.LOOP_ITEM_REF)) {
            const targetTask = tasks.find((t) => t.taskReferenceName === referencedTaskName);
            if (!targetTask) {
              issue = {
                taskReferenceName,
                issueType: ValidationIssueType.ERROR,
                humanMessage: {
                  en: `Properity ${getI18NValue(displayName, 'en-US')} referenced a unknown block: ${referencedTaskName}`,
                  zh: `${getI18NValue(displayName, 'zh-CN')}参数中引用了一个不存在的 Block：${referencedTaskName}`,
                },
                detailReason: {
                  name: name,
                  type: ValidationReasonType.REFERENCED_UNKNOWN_TASK,
                  detailInfomation: {
                    invalidReferenceExpression: match,
                    referencedTaskName,
                  },
                },
              };
            }
          }
        }
      } else {
        // 校验数据类型
        const isDataTypeValid = this.validateToolInputParameterDataType(proprity, value);
        if (!isDataTypeValid) {
          issue = {
            taskReferenceName,
            issueType: ValidationIssueType.ERROR,
            humanMessage: {
              en: `Properity ${name} require ${type} type, but received ${typeof value}`,
              zh: `${getI18NValue(displayName)}参数需要 ${type} 类型数据，但是填入的数据类型为 ${typeof value}`,
            },
            detailReason: {
              name: name,
              type: ValidationReasonType.VALUE_TYPE_NOT_MATCH,
              detailInfomation: {
                requiredType: type,
                receivedType: typeof value,
              },
            },
          };
        }
      }
    }

    return issue;
  }

  private static validateToolInputParameters(tasks: WorkflowTask[], task: WorkflowTask, tool: ToolDef): WorkflowValidationIssue[] {
    const properties: ToolProperty[] = tool.input;
    const issues: WorkflowValidationIssue[] = [];
    for (const prop of properties) {
      const issue = this.validateToolInputParameter(tasks, task, tool, prop);
      if (issue) {
        issues.push(issue);
      }
    }
    return issues;
  }

  private static validateCredentialIssues(task: WorkflowTask, block: ToolDef) {
    const issues: WorkflowValidationIssue[] = [];
    if (block.credentials?.length) {
      for (const credential of block.credentials) {
        const { name, required } = credential;
        if (required && task.inputParameters?.credential?.type !== name) {
          issues.push({
            taskReferenceName: task.taskReferenceName,
            issueType: ValidationIssueType.ERROR,
            humanMessage: {
              zh: `缺少密钥信息`,
              en: `Missing Credential Data`,
            },
            detailReason: {
              type: ValidationReasonType.MISSING_CREDENTIAL,
              name: 'credential',
            },
          });
        }
      }
    }
    return issues;
  }

  private static validateToolStructure(task: WorkflowTask) {
    const issues: WorkflowValidationIssue[] = [];
    switch (task.type) {
      case ToolType.DO_WHILE:
        if (!task.loopOver?.length || task.loopOver[0].name === 'fake_node') {
          issues.push({
            taskReferenceName: task.taskReferenceName,
            issueType: ValidationIssueType.ERROR,
            humanMessage: {
              zh: `循环节点循环体必须包含至少一个 Block`,
              en: `DO_WHILE Task must contains at least one block in loopOver`,
            },
            detailReason: {
              type: ValidationReasonType.DO_WHILE_EMPTY_LOOP_OVER,
              name: 'loopOver',
            },
          });
        }
        if (task.inputParameters.mode === 'list') {
          const { listToLoopOver } = task.inputParameters;
          const matches = this.isExpression(listToLoopOver);
          if (!matches) {
            issues.push({
              taskReferenceName: task.taskReferenceName,
              issueType: ValidationIssueType.ERROR,
              humanMessage: {
                zh: `循环列表值不是一个合法的列表`,
                en: `DO_WHILE task listToLoopOver is not a valid list`,
              },
              detailReason: {
                type: ValidationReasonType.INALID_VALUE,
                name: 'listToLoopOver',
              },
            });
          }
        }
        break;
      default:
        break;
    }
    return issues;
  }

  private static validateSubWorkflow(task: WorkflowTask) {
    const issues: WorkflowValidationIssue[] = [];
    const { subWorkflowParam } = task;
    if (!subWorkflowParam) {
      issues.push({
        taskReferenceName: task.taskReferenceName,
        issueType: ValidationIssueType.ERROR,
        humanMessage: {
          zh: `子流程数据结构错误: subWorkflowParam 不存在`,
          en: `Sub workflow error: subWorkflowParam is missing`,
        },
        detailReason: {
          type: ValidationReasonType.SUB_WORKFLOW_PARAM_MISSING,
          name: 'subWorkflowParam',
        },
      });
    } else {
      const { workflowDefinition, name, version } = task.subWorkflowParam;
      if (!name) {
        issues.push({
          taskReferenceName: task.taskReferenceName,
          issueType: ValidationIssueType.ERROR,
          humanMessage: {
            zh: `子流程数据结构错误: name 不存在`,
            en: `Sub workflow error: name is missing`,
          },
          detailReason: {
            type: ValidationReasonType.VALUE_REQUIRED,
            name: 'name',
          },
        });
      }
      if (!workflowDefinition && !version) {
        issues.push({
          taskReferenceName: task.taskReferenceName,
          issueType: ValidationIssueType.ERROR,
          humanMessage: {
            zh: `子流程数据结构错误: version 未设置`,
            en: `Sub workflow error: version is missing`,
          },
          detailReason: {
            type: ValidationReasonType.VALUE_REQUIRED,
            name: 'version',
          },
        });
      }
    }
    return issues;
  }

  /**
   * 校验 workflow block 的输入参数是否合法
   *
   * 1. 之后开发的 block 不一定是转发 bff 接口实现的
   * 2. 开放工作流 API 后，需要过滤危险输入，提升报错可读性
   * 3. Co-pilot 生成的数据结构需要校验
   */
  public static validateWorkflow(tasks: WorkflowTask[], output: WorkflowOutputValue[], blocks: ToolDef[]) {
    const flattedTasks: WorkflowTask[] = flatTasks(tasks);
    let issues: WorkflowValidationIssue[] = [];
    // 校验 tasks
    for (const task of flattedTasks) {
      // 单独校验子流程
      if (task.type === ToolType.SUB_WORKFLOW) {
        const subWorkflowIssues = this.validateSubWorkflow(task);
        issues = issues.concat(subWorkflowIssues);
      } else if (task.type === ToolType.FORK_JOIN || task.type === ToolType.JOIN) {
        // TODO
      } else {
        const block = blocks.find((block) => block.name === task.name);
        if (block) {
          if (task.type !== ToolType.SWITCH) {
            const inputParameterIssues = this.validateToolInputParameters(flattedTasks, task, block);
            issues = issues.concat(inputParameterIssues);
          }

          const structureIssues = this.validateToolStructure(task);
          issues = issues.concat(structureIssues);

          const credentalIssues = this.validateCredentialIssues(task, block);
          issues = issues.concat(credentalIssues);

          // 特殊类型的 block，可能还需要一些特殊的校验规则
          const blockSpecificIssues = this.validateToolSpecificIssues(task, block);
          issues = issues.concat(blockSpecificIssues);
        }
      }
    }

    // 校验 output
    if (output?.length) {
      for (const { key, value } of output) {
        const matches = this.isExpression(value);
        if (matches) {
          // 校验引用数据
          // 需要检测到装配其他 block 类型的场景，比如一个 number 类型的输入，可能 value 是 ${some_block_ref.output.value} （字符串类型）
          for (const match of matches) {
            const referencedTaskName = match.slice(2).split('.')[0];
            if (referencedTaskName !== this.WORKFLOW_NAME && !referencedTaskName.includes(this.LOOP_ITEM_REF)) {
              const targetTask = flattedTasks.find((t) => t.taskReferenceName === referencedTaskName);
              if (!targetTask) {
                const issue = {
                  taskReferenceName: 'workflow_end',
                  issueType: ValidationIssueType.ERROR,
                  humanMessage: {
                    en: `Properity ${key} referenced a unknown block: ${referencedTaskName}`,
                    zh: `${key}参数中引用了一个不存在的 Block：${referencedTaskName}`,
                  },
                  detailReason: {
                    name: key,
                    type: ValidationReasonType.REFERENCED_UNKNOWN_TASK,
                    detailInfomation: {
                      invalidReferenceExpression: match,
                      referencedTaskName,
                    },
                  },
                };
                issues.push(issue);
              }
            }
          }
        }
      }
    }

    return issues;
  }
}
