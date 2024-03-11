import React, { createContext, createElement, useContext, useEffect, useReducer } from 'react';

import { useSWRConfig } from 'swr';

import { MonkeyWorkflow } from '@inf-monkeys/vines';
import { toast } from 'sonner';

import { useToolLists } from '@/apis/tools';
import { updateWorkflow, useWorkflowList } from '@/apis/workflow';
import { VinesTask } from '@/package/vines-flow/core/nodes/typings.ts';
import { _vines } from '@/package/vines-flow/index.ts';
import { readLocalStorageValue } from '@/utils';

interface VinesContext {
  _refresher?: number;
  forceUpdate?: React.DispatchWithoutAction;
}

const forceUpdateReducer = (value: number) => (value + 1) % 1000000;

export const createVinesCore = () => {
  const VinesContext = createContext<VinesContext | undefined>(void 0);

  const VinesProvider = ({ children }: { children: React.ReactNode }) => {
    const { mutate } = useSWRConfig();
    const [_refresher, forceUpdate] = useReducer(forceUpdateReducer, 0);

    const handleUpdate = (tasks: VinesTask[]) => {
      forceUpdate();

      const apikey = readLocalStorageValue('vines-apikey', '', false);
      const workflowId = _vines.workflowId;
      if (!workflowId) {
        toast.error('工作流 ID 不存在！');
        return;
      }

      toast.promise(
        updateWorkflow(apikey, workflowId, _vines.version, { workflowDef: { tasks } } as Partial<MonkeyWorkflow>),
        {
          loading: '更新中...',
          success: '更新成功',
          error: '更新失败',
        },
      );

      void mutate(`/api/workflow/${workflowId}`, { workflowDef: { tasks } }, { revalidate: false });
    };

    useEffect(() => {
      _vines.on('refresh', forceUpdate);
      _vines.on('update', handleUpdate);
      return () => {
        _vines.off('refresh', forceUpdate);
        _vines.off('update', handleUpdate);
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
