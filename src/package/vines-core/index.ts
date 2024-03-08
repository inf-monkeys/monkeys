import { VinesCore } from '@/package/vines-core/core';
import { createVinesCore } from '@/package/vines-core/create';

const _vines = new VinesCore();

const { VinesProvider, useVinesRefresher } = createVinesCore();

export { _vines, useVinesRefresher, VinesProvider };
