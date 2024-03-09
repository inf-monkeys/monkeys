export type Constructor<T = {}> = new (...args: any[]) => T;

export enum VINES_STATUS {
  IDLE = 'idle',
  READY = 'ready',
  BUSY = 'busy',
}
