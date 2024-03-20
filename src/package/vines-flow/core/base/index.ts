import EventEmitter from 'eventemitter3';

import { VINES_STATUS } from '@/package/vines-flow/core/typings.ts';

export class VinesBase extends EventEmitter {
  public status: VINES_STATUS = VINES_STATUS.IDLE;

  constructor() {
    super();
  }

  protected sendEvent(event: 'update' | 'refresh' | 'execution', ...args: unknown[]) {
    this.emit(event, ...args);
  }
}
