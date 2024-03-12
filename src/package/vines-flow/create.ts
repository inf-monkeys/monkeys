import React, { createContext, createElement, useCallback, useContext, useEffect, useReducer } from 'react';

import { useSWRConfig } from 'swr';

import { MonkeyWorkflow } from '@inf-monkeys/vines';
import { toast } from 'sonner';

import { useToolLists } from '@/apis/tools';
import { useUpdateWorkflow, useWorkflowList } from '@/apis/workflow';
import { VinesCore } from '@/package/vines-flow/core';
import { VinesTask } from '@/package/vines-flow/core/nodes/typings.ts';
import { readLocalStorageValue } from '@/utils';
import { useRetimer } from '@/utils/use-retimer.ts';

interface VinesContext {
  _vines: VinesCore;
  _refresher?: number;
  forceUpdate?: React.DispatchWithoutAction;
}

const forceUpdateReducer = (value: number) => (value + 1) % 1000000;

const VinesMap = new Map<string, VinesCore>();

function getOrCreateVinesCore(workflowId: string): VinesCore {
  if (VinesMap.has(workflowId)) {
    return VinesMap.get(workflowId)!;
  }
  const newVinesCore = new VinesCore();
  VinesMap.set(workflowId, newVinesCore);
  return newVinesCore;
}
const VinesContext = createContext<VinesContext | undefined>(void 0);

export const useVinesRefresher = () => {
  const context = useContext(VinesContext);
  if (context === void 0) {
    throw new Error('useVinesRefresher must be used within a VinesProvider');
  }
  return context;
};

export const createVinesCore = (workflowId: string) => {
  const _vines = getOrCreateVinesCore(workflowId);
  const VinesProvider = ({ children }: { children: React.ReactNode }) => {
    const { mutate } = useSWRConfig();
    const [_refresher, forceUpdate] = useReducer(forceUpdateReducer, 0);

    const { trigger } = useUpdateWorkflow(readLocalStorageValue('vines-apikey', '', false), _vines.workflowId ?? '');

    const reTimer = useRetimer();
    const handleUpdate = useCallback(
      (tasks: VinesTask[]) => {
        reTimer(
          setTimeout(() => {
            forceUpdate();

            const workflowId = _vines.workflowId;
            if (!workflowId) {
              toast.error('工作流 ID 不存在！');
              return;
            }

            toast.promise(trigger({ version: _vines.version, workflowDef: { tasks } } as Partial<MonkeyWorkflow>), {
              loading: '更新中...',
              success: '更新成功',
              error: '更新失败',
            });

            void mutate(`/api/workflow/${workflowId}`, (prev) => ({ ...prev, workflowDef: { tasks } }), {
              revalidate: false,
            });
          }, 100) as unknown as number,
        );
      },
      [reTimer],
    );

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

    return createElement(VinesContext.Provider, { value: { _vines, _refresher, forceUpdate } }, children);
  };

  return { VinesProvider };
};
