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

export interface IVinesFlowRenderOptions {
  direction: 'horizontal' | 'vertical';
  type: IVinesFlowRenderType;
}
