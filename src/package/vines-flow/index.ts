import { VinesCore } from '@/package/vines-flow/core';
import { createVinesCore } from '@/package/vines-flow/create.ts';

const _vines = new VinesCore();

const { VinesProvider, useVinesRefresher } = createVinesCore();

export { _vines, useVinesRefresher, VinesProvider };
