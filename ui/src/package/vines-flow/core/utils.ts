import { get, merge, setWith } from 'lodash';
import { customAlphabet } from 'nanoid';

import { VinesNode, VinesSubWorkflowTaskDef } from '@/package/vines-flow/core/nodes';
import { IVinesNodeBoundary, VinesTask } from '@/package/vines-flow/core/nodes/typings.ts';
import { VinesToolDef, VinesToolDefProperties } from '@/package/vines-flow/core/tools/typings.ts';
import {
  DoWhileTaskDef,
  ForkJoinTaskDef,
  type SubWorkflowTaskDef,
  SwitchTaskDef,
  TaskType,
} from '@/package/vines-flow/share/types.ts';

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
    inputParameters: {
      version: 1,
    },
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

const createFakeNode = () => {
  return {
    name: 'fake_node',
    taskReferenceName: `fake_node_${createNanoId()}`,
    type: 'SIMPLE' as TaskType.SIMPLE,
  };
};

export const createTask = (tool: VinesToolDef, extendObject = {}): VinesTask => {
  const { name, type, input: properties } = tool;
  const newTaskRefName = `${name}_${createNanoId()}`;
  const inputParameters = autoTypeTransform(properties, {});

  const newTask: VinesTask = {
    name,
    type: type as never,
    taskReferenceName: newTaskRefName,
    inputParameters: {
      ...inputParameters,
      __advancedConfig: {
        timeout: get(tool, 'extra.defaultTimeout', 3600),
      },
    },
  };

  merge(newTask, get(tool, '_preset', {}), extendObject);

  // 提取特殊字段
  const { loopCondition, evaluatorType, expression, ...rest } = newTask.inputParameters as any;
  newTask.inputParameters = rest;

  Object.assign(newTask, {
    ...(loopCondition !== undefined && { loopCondition }),
    ...(evaluatorType !== undefined && { evaluatorType: evaluatorType as never }),
    ...(expression !== undefined && { expression: expression as never }),
  });

  // 补充特定类型的 fake 节点
  switch (type) {
    case 'DO_WHILE':
      (newTask as unknown as DoWhileTaskDef).loopOver = [createFakeNode()];
      break;
    case 'SWITCH':
      (newTask as unknown as SwitchTaskDef).decisionCases = {
        switchTrue: [createFakeNode()],
        switchFalse: [createFakeNode()],
      };
      break;
    case 'FORK_JOIN':
      (newTask as unknown as ForkJoinTaskDef).forkTasks = [[createFakeNode()], [createFakeNode()]];
      break;
  }

  return replaceBuiltInValue(newTask, { _TaskRefName_: newTaskRefName }) as VinesTask;
};

export const VARIABLE_REGEXP = /\$\{[a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)*}/g;

export const autoTypeTransform = (
  properties: VinesToolDefProperties[] | undefined,
  obj: Record<string, unknown>,
): Record<string, unknown> => {
  properties?.forEach(({ name, type, default: defaultValue, typeOptions }) => {
    const value = get(obj, name);

    if (value !== undefined && !VARIABLE_REGEXP.test(value as string)) {
      const setValue = (val: unknown) => setWith(obj, name, val);

      switch (type) {
        case 'boolean':
          if (typeof value === 'string') setValue(value === 'true');
          break;
        case 'number':
          // eslint-disable-next-line no-case-declarations
          const num = Number(value);
          if (!Number.isNaN(num)) {
            setValue(num);
          }
          break;
        case 'string':
          setValue((value as unknown)?.toString()?.trim() ?? null);
          break;
      }

      if (typeOptions?.multipleValues && !Array.isArray(value)) {
        setValue((value as unknown)?.toString()?.split(',') ?? defaultValue);
      }
    } else if (defaultValue !== undefined) {
      setWith(obj, name, defaultValue);
    } else if (type === 'boolean') {
      setWith(obj, name, false);
    } else if (typeOptions?.multipleValues) {
      setWith(obj, name, []);
    }
  });

  return obj;
};

export const replaceBuiltInValue = (obj: any, builtValues: Record<string, string>): any => {
  const replace = (value: string) =>
    Object.entries(builtValues).reduce((acc, [key, val]) => acc.replace(key, val), value);

  const traverse = (item: any): any => {
    if (typeof item === 'string') {
      return replace(item);
    }
    if (Array.isArray(item)) {
      return item.map(traverse);
    }
    if (typeof item === 'object' && item !== null) {
      return Object.fromEntries(Object.entries(item).map(([key, val]) => [key, traverse(val)]));
    }
    return item;
  };

  return traverse(obj);
};
