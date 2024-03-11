import { VinesNode } from '@/package/vines-flow/core/nodes';

export type Constructor<T = {}> = new (...args: any[]) => T;

export enum VINES_STATUS {
  IDLE = 'idle',
  READY = 'ready',
  BUSY = 'busy',
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
