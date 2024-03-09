import { _vines, useVinesRefresher } from '@/package/vines-flow/index.ts';

export const useVinesFlow = () => {
  const { _refresher } = useVinesRefresher();

  return {
    vines: _vines,
    vinesTools: _vines.tools,

    VINES_REFRESHER: _refresher,
  };
};
