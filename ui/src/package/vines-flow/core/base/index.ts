import EventEmitter from 'eventemitter3';
import type { TFunction } from 'i18next';

import { VINES_STATUS } from '@/package/vines-flow/core/typings.ts';

export class VinesBase extends EventEmitter {
  public status: VINES_STATUS = VINES_STATUS.IDLE;
  public t: TFunction | undefined;

  constructor(t?: TFunction) {
    super();

    this.t = t;
  }

  protected sendEvent(event: 'update' | 'refresh' | 'update-execution', ...args: unknown[]) {
    this.emit(event, ...args);
  }
}
