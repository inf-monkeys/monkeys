import React, { createContext, createElement, useContext, useEffect, useReducer } from 'react';

import { useToolLists } from '@/apis/tools';
import { useWorkflowList } from '@/apis/workflow';
import { _vines } from '@/package/vines-flow/index.ts';

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
      _vines.on('refresh', forceUpdate);
      return () => {
        _vines.off('refresh', forceUpdate);
      };
    }, []);

    const { data: tools } = useToolLists();
    const { data: workflows } = useWorkflowList({ page: 1, limit: 9999 });

    useEffect(() => {
      tools?.length && _vines.updateTools(tools);
    }, [tools]);

    useEffect(() => {
      workflows?.length && _vines.updateWorkflows(workflows);
    }, [workflows]);

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
