import { DoWhileTaskDef, ForkJoinTaskDef, SwitchTaskDef, TaskType, WorkflowTask } from '@io-orkes/conductor-javascript';
import { get, merge, setWith } from 'lodash';

import { VinesCore } from '@/package/vines-flow/core';
import { VinesNode } from '@/package/vines-flow/core/nodes/base.ts';
import { VinesSubWorkflowTaskDef } from '@/package/vines-flow/core/nodes/node/sub-workflow.ts';
import { VinesTask } from '@/package/vines-flow/core/nodes/typings.ts';
import { VinesBlockDefProperties, VinesToolDef } from '@/package/vines-flow/core/tools/typings.ts';
import { createNanoId } from '@/package/vines-flow/core/utils.ts';

export function createNewSubWorkflow(tasks: VinesTask[], vinesCore: VinesCore) {
  const nodeId = 'sub_workflow_nested_' + createNanoId();
  const subWorkflowTaskDef: Required<Omit<VinesSubWorkflowTaskDef, 'subWorkflowParam'>> = {
    name: 'sub_workflow',
    taskReferenceName: nodeId,
    type: TaskType.SUB_WORKFLOW,
    inputParameters: {
      name: '',
      version: 1,
    },
    subWorkflow: {
      name: nodeId,
      iconUrl: 'emoji:🍀:#ceefc5',
      description: '',
      workflowDef: {
        tasks,
      },
    },
  };

  return VinesNode.create(subWorkflowTaskDef as VinesSubWorkflowTaskDef, vinesCore);
}

// TODO: SHIT OF CODE !!!
// region SHIT OF CODE !!!
export function createTask(tool: VinesToolDef, extendObject = {}) {
  const { name, type, input: properties } = tool;
  const inputParameters = autoTypeTransform(properties, {});
  const newTaskRefName = `${name}_${Math.random().toString(36).slice(-8)}`;
  const newTask: VinesTask = {
    name,
    type: type as never,
    taskReferenceName: newTaskRefName,
    inputParameters,
  };

  merge(newTask, extendObject);

  // 将特殊的字段提取到 inputParameters 外
  const { loopCondition, evaluatorType, expression, ...rest } = newTask.inputParameters as any;
  newTask.inputParameters = rest;
  if (typeof loopCondition !== 'undefined') {
    (newTask as WorkflowTask).loopCondition = loopCondition as string;
  }
  if (typeof evaluatorType !== 'undefined') {
    (newTask as WorkflowTask).evaluatorType = evaluatorType as never;
  }
  if (typeof expression !== 'undefined') {
    (newTask as WorkflowTask).expression = expression as never;
  }

  // 补充 fake 节点
  if (type === 'DO_WHILE') {
    (newTask as unknown as DoWhileTaskDef).loopOver = [
      {
        name: 'fake_node',
        taskReferenceName: `fake_node_${Math.random().toString(36).slice(-8)}`,
        type: 'SIMPLE' as TaskType.SIMPLE,
      },
    ];
  }
  if (type === 'SWITCH') {
    (newTask as unknown as SwitchTaskDef).decisionCases = {
      switchTrue: [
        {
          name: 'fake_node',
          taskReferenceName: `fake_node_${Math.random().toString(36).slice(-8)}`,
          type: 'SIMPLE' as TaskType.SIMPLE,
        },
      ],
      switchFalse: [
        {
          name: 'fake_node',
          taskReferenceName: `fake_node_${Math.random().toString(36).slice(-8)}`,
          type: 'SIMPLE' as TaskType.SIMPLE,
        },
      ],
    };
  }
  if (type === 'FORK_JOIN') {
    (newTask as unknown as ForkJoinTaskDef).forkTasks = [
      [
        {
          name: 'fake_node',
          taskReferenceName: `fake_node_${Math.random().toString(36).slice(-8)}`,
          type: 'SIMPLE' as TaskType.SIMPLE,
        },
      ],
      [
        {
          name: 'fake_node',
          taskReferenceName: `fake_node_${Math.random().toString(36).slice(-8)}`,
          type: 'SIMPLE' as TaskType.SIMPLE,
        },
      ],
    ];
  }

  const reNewTask = replaceBuiltInValue(newTask, {
    _TaskRefName_: newTaskRefName,
  });

  return reNewTask as VinesTask;
}
export const VARIABLE_REGEXP = /\$\{[a-zA-Z0-9_]+\.[a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)*}/g;

export const autoTypeTransform = (
  properties: VinesBlockDefProperties[] | undefined,
  obj: Record<string, unknown>,
): Record<string, unknown> => {
  console.log(properties);
  properties?.forEach(({ name, type, default: defaultValue, typeOptions }) => {
    const value = get(obj, name);

    if (value !== undefined) {
      const valueType = typeof value;

      // 跳过含有变量的情况
      if (!VARIABLE_REGEXP.test(value as string)) {
        switch (type) {
          case 'boolean':
            if (valueType === 'string') {
              setWith(obj, name, value === 'true');
            }
            break;
          case 'number':
            if (!Number.isNaN(Number(value))) {
              setWith(obj, name, Number(value));
            }
            break;
          case 'string':
            setWith(obj, name, (value as unknown)?.toString()?.trim() ?? null);
            break;
          default:
            break;
        }

        if (typeOptions?.multipleValues) {
          if (!Array.isArray(value)) {
            setWith(obj, name, (value as unknown)?.toString()?.split(',') ?? defaultValue);
          }
        }
      }
    } else if (defaultValue !== void 0) {
      setWith(obj, name, defaultValue);
    } else {
      // 最次最次用系统默认值
      if (type === 'string') {
        setWith(obj, name, null);
      } else if (typeOptions?.multipleValues) {
        setWith(obj, name, []);
      } else if (type === 'boolean') {
        setWith(obj, name, false);
      }
    }
  });

  return obj;
};

export const replaceBuiltInValue = (obj: any, builtValues: Record<string, string>): any => {
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      for (const [builtInKey, builtInValue] of Object.entries(builtValues)) {
        if (value.includes(builtInKey)) {
          obj[key] = value.replace(builtInKey, builtInValue);
        }
      }
    } else if (typeof value === 'object' && value !== null) {
      replaceBuiltInValue(value, builtValues);
    } else if (Array.isArray(value) && value) {
      value.forEach((v) => replaceBuiltInValue(v, builtValues));
    }
  }
  return obj;
};
// endregion SHIT OF CODE !!!
