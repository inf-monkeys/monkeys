import { WorkflowTriggerType } from '@/apis/workflow/trigger/typings.ts';
import { VinesNode } from '@/package/vines-flow/core/nodes';
import { VinesNodeExecutionTask } from '@/package/vines-flow/core/nodes/typings.ts';
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
  debug?: boolean;
  chatSessionId?: string;
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

export type VinesWorkflowExecution = Omit<WorkflowExecution, 'tasks'> & {
  tasks: VinesNodeExecutionTask[];
  originTasks: Array<Task>;
  triggerType?: WorkflowTriggerType;
};
