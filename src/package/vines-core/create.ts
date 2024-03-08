import React, { createContext, createElement, useContext, useEffect, useReducer } from 'react';

import { _vines } from '@/package/vines-core';

interface VinesContext {
  _refresher?: number;
  forceUpdate?: React.DispatchWithoutAction;
}

const forceUpdateReducer = (value: number) => (value + 1) % 1000000;

export const createVinesCore = () => {
  const VinesContext = createContext<VinesContext | undefined>(void 0);

  const VinesProvider = ({ children }: { children: React.ReactNode }) => {
    const [_refresher, forceUpdate] = useReducer(forceUpdateReducer, 0);

    useEffect(() => {
      _vines.on('update', forceUpdate);
      return () => {
        _vines.off('update', forceUpdate);
      };
    }, []);

    return createElement(VinesContext.Provider, { value: { _refresher, forceUpdate } }, children);
  };

  const useVinesRefresher = () => {
    const context = useContext(VinesContext);
    if (context === void 0) {
      throw new Error('useVinesRefresher must be used within a VinesProvider');
    }
    return context;
  };

  return { VinesProvider, useVinesRefresher };
};
