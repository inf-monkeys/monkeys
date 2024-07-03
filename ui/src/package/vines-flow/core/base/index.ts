import EventEmitter from 'eventemitter3';
import type { i18n } from 'i18next';

import { VINES_STATUS } from '@/package/vines-flow/core/typings.ts';

export class VinesBase extends EventEmitter {
  public status: VINES_STATUS = VINES_STATUS.IDLE;
  public t: i18n | undefined;

  constructor(i18n?: i18n) {
    super();

    this.t = i18n;
  }

  protected sendEvent(event: 'update' | 'refresh' | 'update-execution', ...args: unknown[]) {
    this.emit(event, ...args);
  }
}
