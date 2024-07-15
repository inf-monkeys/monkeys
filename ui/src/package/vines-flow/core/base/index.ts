import EventEmitter from 'eventemitter3';
import type { i18n, TFunction } from 'i18next';

import { VINES_STATUS } from '@/package/vines-flow/core/typings.ts';

export class VinesBase extends EventEmitter {
  public status: VINES_STATUS = VINES_STATUS.IDLE;
  public i18n: i18n | undefined;
  public t: TFunction | undefined;

  constructor(i18n?: i18n) {
    super();

    this.i18n = i18n;
    this.t = i18n?.t;
  }

  protected sendEvent(event: 'update' | 'refresh' | 'update-execution', ...args: unknown[]) {
    this.emit(event, ...args);
  }
}
