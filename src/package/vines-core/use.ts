import { _vines, useVinesRefresher } from '@/package/vines-core';

export const useVinesCore = () => {
  const { _refresher } = useVinesRefresher();

  return {
    vines: _vines,
    vinesTools: _vines.tools,
    VINES_REFRESHER: _refresher,
  };
};
