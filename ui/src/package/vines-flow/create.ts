import React, { createContext, createElement, useCallback, useContext, useEffect, useReducer } from 'react';

import { useSWRConfig } from 'swr';

import { MonkeyWorkflow } from '@inf-monkeys/monkeys';
import type { TFunction } from 'i18next';
import { isArray } from 'lodash';
import { toast } from 'sonner';

import { useToolLists } from '@/apis/tools';
import { useUpdateWorkflow, useWorkflowList } from '@/apis/workflow';
import { VinesCore } from '@/package/vines-flow/core';
import { VinesTask } from '@/package/vines-flow/core/nodes/typings.ts';
import { VinesWorkflowExecution } from '@/package/vines-flow/core/typings.ts';
import { useRetimer } from '@/utils/use-retimer.ts';

interface VinesContext {
  _vines: VinesCore;
  _refresher?: number;
  forceUpdate?: React.DispatchWithoutAction;
}

const forceUpdateReducer = (value: number) => (value + 1) % 1000000;

const VinesMap = new Map<string, VinesCore>();

function getOrCreateVinesCore(workflowId: string, t?: TFunction): VinesCore {
  if (VinesMap.has(workflowId)) {
    return VinesMap.get(workflowId)!;
  }
  const newVinesCore = new VinesCore(t);
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

export const createVinesCore = (workflowId: string, t?: TFunction) => {
  const _vines = getOrCreateVinesCore(workflowId, t);
  const VinesProvider = ({ children }: { children: React.ReactNode }) => {
    const { mutate } = useSWRConfig();
    const [_refresher, forceUpdate] = useReducer(forceUpdateReducer, 0);

    const { trigger } = useUpdateWorkflow(_vines.workflowId ?? '');

    const reTimer = useRetimer();
    const handleUpdate = useCallback(
      (tasks: VinesTask[]) => {
        reTimer(
          setTimeout(() => {
            forceUpdate();

            const workflowVersion = _vines.version;
            const workflowId = _vines.workflowId;
            if (!workflowId) {
              toast.error('工作流 ID 不存在！');
              return;
            }

            const newWorkflow = {
              version: workflowVersion,
              ...(tasks?.length && { tasks }),
              variables: _vines.workflowInput,
            } as Partial<MonkeyWorkflow>;

            toast.promise(trigger(newWorkflow), {
              loading: '更新中...',
              success: (newValidation) => {
                void mutate(`/api/workflow/${workflowId}/validation-issues?version=${workflowVersion}`, newValidation, {
                  revalidate: false,
                });
                return '更新成功';
              },
              error: '更新失败',
            });

            void mutate(`/api/workflow/metadata/${workflowId}`, (prev) => ({ ...prev, ...newWorkflow }), {
              revalidate: false,
            });
            void mutate(
              `/api/workflow/metadata/${workflowId}/versions`,
              (prev: MonkeyWorkflow[] | undefined) => {
                const currentVersionWorkflowIndex = prev?.findIndex((it) => it.version === workflowVersion);
                if (currentVersionWorkflowIndex === void 0 || currentVersionWorkflowIndex === -1) {
                  return prev;
                }
                prev?.splice(currentVersionWorkflowIndex, 1, { ...prev[currentVersionWorkflowIndex], ...newWorkflow });
                return prev;
              },
              {
                revalidate: false,
              },
            );
          }, 100) as unknown as number,
        );
      },
      [reTimer],
    );

    const handleUpdateExecutionDataToSWR = useCallback((instanceId: string, data: VinesWorkflowExecution) => {
      void mutate(`/api/workflow/executions/${instanceId}`, data, { revalidate: false });
    }, []);

    useEffect(() => {
      _vines.on('refresh', forceUpdate);
      _vines.on('update', handleUpdate);
      _vines.on('update-execution', handleUpdateExecutionDataToSWR);
      return () => {
        _vines.off('refresh', forceUpdate);
        _vines.off('update', handleUpdate);
        _vines.off('update-execution', handleUpdateExecutionDataToSWR);
      };
    }, []);

    const { data: tools } = useToolLists();
    const { data: workflows } = useWorkflowList({ page: 1, limit: 9999 });

    useEffect(() => {
      isArray(tools) && _vines.updateTools(tools);
    }, [tools]);

    useEffect(() => {
      isArray(workflows) && _vines.updateWorkflows(workflows);
    }, [workflows]);

    return createElement(VinesContext.Provider, { value: { _vines, _refresher, forceUpdate } }, children);
  };

  return { VinesProvider };
};
