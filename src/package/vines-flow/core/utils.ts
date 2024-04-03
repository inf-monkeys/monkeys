import {
  DoWhileTaskDef,
  ForkJoinTaskDef,
  type SubWorkflowTaskDef,
  SwitchTaskDef,
  TaskType,
  WorkflowTask,
} from '@io-orkes/conductor-javascript';
import { get, merge, setWith } from 'lodash';
import { customAlphabet } from 'nanoid';

import { VinesNode, VinesSubWorkflowTaskDef } from '@/package/vines-flow/core/nodes';
import { IVinesNodeBoundary, VinesTask } from '@/package/vines-flow/core/nodes/typings.ts';
import { VinesToolDef, VinesToolDefProperties } from '@/package/vines-flow/core/tools/typings.ts';

export const createNanoId = customAlphabet('6789BCDFGHJKLMNPQRTWbcdfghjkmnpqrtwz', 8);

export const getBoundary = (children: VinesNode[]): IVinesNodeBoundary => {
  return children
    .filter((node) => node.needRender)
    .map((it) => it.getBoundary())
    .reduce(
      (prev, cur) => {
        return {
          left: Math.min(prev.left, cur.left),
          right: Math.max(prev.right, cur.right),
          top: Math.min(prev.top, cur.top),
          bottom: Math.max(prev.bottom, cur.bottom),
        };
      },
      { left: 99999999, right: -99999999, top: 99999999, bottom: -99999999 },
    );
};

export function createSubWorkflowDef(tasks: VinesTask[]) {
  const nodeId = 'sub_workflow_nested_' + createNanoId();
  const subWorkflowTaskDef: Omit<SubWorkflowTaskDef, 'subWorkflowParam'> & {
    subWorkflowParam: {
      name: string;
      workflowDefinition: {
        name: string;
        tasks: VinesTask[];
      };
    };
  } = {
    name: 'sub_workflow',
    taskReferenceName: nodeId,
    type: TaskType.SUB_WORKFLOW,
    inputParameters: {},
    subWorkflowParam: {
      name: nodeId,
      workflowDefinition: {
        name: nodeId,
        tasks,
      },
    },
  };

  return subWorkflowTaskDef as VinesSubWorkflowTaskDef;
}

// TODO: SHIT OF CODE !!!
// region SHIT OF CODE !!!
export const createTask = (tool: VinesToolDef, extendObject = {}) => {
  const { name, type, input: properties } = tool;
  const inputParameters = autoTypeTransform(properties, {});
  const newTaskRefName = `${name}_${createNanoId()}`;
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
        taskReferenceName: `fake_node_${createNanoId()}`,
        type: 'SIMPLE' as TaskType.SIMPLE,
      },
    ];
  }
  if (type === 'SWITCH') {
    (newTask as unknown as SwitchTaskDef).decisionCases = {
      switchTrue: [
        {
          name: 'fake_node',
          taskReferenceName: `fake_node_${createNanoId()}`,
          type: 'SIMPLE' as TaskType.SIMPLE,
        },
      ],
      switchFalse: [
        {
          name: 'fake_node',
          taskReferenceName: `fake_node_${createNanoId()}`,
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
          taskReferenceName: `fake_node_${createNanoId()}`,
          type: 'SIMPLE' as TaskType.SIMPLE,
        },
      ],
      [
        {
          name: 'fake_node',
          taskReferenceName: `fake_node_${createNanoId()}`,
          type: 'SIMPLE' as TaskType.SIMPLE,
        },
      ],
    ];
  }

  const reNewTask = replaceBuiltInValue(newTask, {
    _TaskRefName_: newTaskRefName,
  });

  return reNewTask as VinesTask;
};
export const VARIABLE_REGEXP = /\$\{[a-zA-Z0-9_]+\.[a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)*}/g;

export const autoTypeTransform = (
  properties: VinesToolDefProperties[] | undefined,
  obj: Record<string, unknown>,
): Record<string, unknown> => {
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
