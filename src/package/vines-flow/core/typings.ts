import type { Task, Workflow as WorkflowExecution } from '@io-orkes/conductor-javascript';

import { WorkflowTriggerType } from '@/apis/workflow/trigger/typings.ts';
import { VinesNode } from '@/package/vines-flow/core/nodes';
import { VinesNodeRunTask } from '@/package/vines-flow/core/nodes/typings.ts';

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

export enum IVinesMode {
  EXEC = 'exec',
  EDIT = 'edit',
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
  tasks: VinesNodeRunTask[];
  originTasks: Array<Task>;
  triggerType: WorkflowTriggerType;
};
