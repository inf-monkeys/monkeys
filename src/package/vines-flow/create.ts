import React, { createContext, createElement, useCallback, useContext, useEffect, useReducer, useState } from 'react';

import { useSWRConfig } from 'swr';

import { MonkeyWorkflow } from '@inf-monkeys/vines';
import { toast } from 'sonner';

import { useToolLists } from '@/apis/tools';
import { useUpdateWorkflow, useWorkflowList } from '@/apis/workflow';
import { useWorkflowExecution } from '@/apis/workflow/execution';
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

    const apikey = readLocalStorageValue('vines-apikey', '', false);
    const { trigger } = useUpdateWorkflow(apikey, _vines.workflowId ?? '');

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

            const newWorkflow = {
              version: _vines.version,
              ...(tasks?.length && { workflowDef: { tasks } }),
              variables: _vines.workflowInput,
            } as Partial<MonkeyWorkflow>;

            toast.promise(trigger(newWorkflow), {
              loading: '更新中...',
              success: '更新成功',
              error: '更新失败',
            });

            void mutate(`/api/workflow/${workflowId}`, (prev) => ({ ...prev, ...newWorkflow }), {
              revalidate: false,
            });
            void mutate(
              `/api/workflow/${workflowId}/versions`,
              (prev: MonkeyWorkflow[] | undefined) => {
                const currentVersionWorkflowIndex = prev?.findIndex((it) => it.version === _vines.version);
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

    const [workflowExecutionController, setWorkflowExecutionController] = useState(false);
    const {
      data: workflowExecution,
      mutate: workflowExecutionMutate,
      error: workflowExecutionError,
    } = useWorkflowExecution(workflowExecutionController ? _vines.runningInstanceId : '', apikey);

    useEffect(() => {
      if (workflowExecutionError instanceof Error) {
        _vines.stop().then(() => toast.error(`应用运行状态异常：${workflowExecutionError.message}`));
      }
      if (!workflowExecution) return;
      _vines.updateWorkflowExecution(workflowExecution);
    }, [workflowExecution, workflowExecutionError]);

    const handleWorkflowExecution = useCallback((enable: boolean) => {
      if (!enable) {
        // 在终止获取执行状态前，再次获取一次执行状态
        workflowExecutionMutate().then(() => setWorkflowExecutionController(false));
        return;
      }
      setWorkflowExecutionController(enable);
    }, []);

    useEffect(() => {
      _vines.on('execution', handleWorkflowExecution);
      return () => {
        _vines.off('execution', handleWorkflowExecution);
      };
    }, []);

    return createElement(VinesContext.Provider, { value: { _vines, _refresher, forceUpdate } }, children);
  };

  return { VinesProvider };
};
