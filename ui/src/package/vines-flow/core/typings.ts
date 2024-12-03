import { MonkeyTaskDefTypes } from '@inf-monkeys/monkeys';
import { ToolPropertyTypes } from '@inf-monkeys/monkeys/src/types/tool.ts';

import { WorkflowTriggerType } from '@/apis/workflow/trigger/typings.ts';
import { VinesNode } from '@/package/vines-flow/core/nodes';
import { VinesNodeExecutionTask } from '@/package/vines-flow/core/nodes/typings.ts';
import { JSONValue } from '@/package/vines-flow/core/tools/typings.ts';
import type { Task, Workflow as WorkflowExecution } from '@/package/vines-flow/share/types.ts';

export type Constructor<T = {}> = new (...args: any[]) => T;

export enum VINES_STATUS {
  IDLE = 'idle',
  READY = 'ready',
}

export enum IVinesFlowRenderType {
  COMPLICATE = 'complicate',
  SIMPLIFY = 'simplify',
  MINI = 'mini',
}

export interface IVinesFlowRenderOptions {
  direction: 'horizontal' | 'vertical';
  type: IVinesFlowRenderType;
}

export interface IVinesInsertChildParams {
  targetId: string;
  node: VinesNode | VinesNode[];
  path: VinesNode[];
  insertBefore?: boolean;
}

export interface IVinesFlowRunParams {
  inputData?: Record<string, unknown>;
  instanceId?: string;
  version?: number;
  chatSessionId?: string;
  onlyStart?: boolean;
  tasks?: MonkeyTaskDefTypes[];
}

export type VinesWorkflowExecutionType =
  | 'SCHEDULED' // Vines 内置状态
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'TIMED_OUT'
  | 'TERMINATED'
  | 'PAUSED'
  | 'CANCELED'; // Vines 内置状态

export type VinesWorkflowExecution = Omit<WorkflowExecution, 'tasks' | 'status'> & {
  status?: VinesWorkflowExecutionType;
  tasks: VinesNodeExecutionTask[];
  originTasks: Array<Task>;
  triggerType?: WorkflowTriggerType;
};

export type VinesWorkflowExecutionOutput = {
  type: 'image' | 'video' | 'text' | 'json';
  data: JSONValue;
  alt?: string | string[] | undefined;
};

export type VinesWorkflowExecutionInputs = {
  id: string;
  data: JSONValue;
  type: ToolPropertyTypes;
  displayName: string;
  description: string;
};

export type VinesWorkflowExecutionOutputListItem = {
  status: VinesWorkflowExecutionType;
  startTime: number;
  createTime: number;
  updateTime: number;
  endTime: number;
  instanceId: string;
  workflowId: string;
  input: VinesWorkflowExecutionInputs[];
  output: VinesWorkflowExecutionOutput[];
  rawOutput: Record<string, any>;
  taskId: string;
  userId: string;
  teamId: string;
};
