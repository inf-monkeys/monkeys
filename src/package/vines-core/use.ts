import { _vines, useVinesRefresher } from '@/package/vines-core';

export const useVinesCore = () => {
  useVinesRefresher();

  return { vines: _vines };
};
