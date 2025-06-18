import React, { useCallback, useEffect, useRef, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useMutationSearchWorkflowExecutions } from '@/apis/workflow/execution';
import { VinesWorkflowExecutionLists } from '@/apis/workflow/execution/typings.ts';
import { VinesLogViewLogFilter } from '@/components/layout/workspace/vines-view/log/log/filter';
import { VinesLogViewLogList } from '@/components/layout/workspace/vines-view/log/log/list';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { Separator } from '@/components/ui/separator.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useVinesFlow } from '@/package/vines-flow';
import {
  IVinesSearchWorkflowExecutionsParams,
  vinesSearchWorkflowExecutionsSchema,
} from '@/schema/workspace/workflow-execution.ts';
import { cn } from '@/utils';

interface IVinesLogViewLogTabProps {
  visible: boolean;
  workbenchVisible: boolean;
  containerHeight: number;
}

const POLLING_INTERVAL = 1000;
export const VinesLogViewLogTab: React.FC<IVinesLogViewLogTabProps> = ({
  visible,
  workbenchVisible,
  containerHeight,
}) => {
  const { t } = useTranslation();

  const { vines } = useVinesFlow();

  const [sidebarVisible, setSidebarVisible] = useState(!workbenchVisible);
  const [activeTab, setActiveTab] = useState('');

  // 轮询相关状态
  const [lastQueryParams, setLastQueryParams] = useState<IVinesSearchWorkflowExecutionsParams | null>(null);
  const [isPolling, setIsPolling] = useState(true);
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const form = useForm<IVinesSearchWorkflowExecutionsParams>({
    resolver: zodResolver(vinesSearchWorkflowExecutionsSchema),
    defaultValues: {
      workflowInstanceId: '',
    },
  });

  const { data: searchWorkflowExecutionsData, trigger } = useMutationSearchWorkflowExecutions();
  const isMutating = false;
  const workflowPageRef = useRef(1);

  // 停止轮询
  const stopPolling = useCallback(() => {
    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current);
      pollingTimeoutRef.current = null;
    }
  }, []);

  // 递归轮询函数
  const startPolling = useCallback(async () => {
    if (!isPolling || isUserInteracting) {
      return;
    }

    // 确定查询参数
    let queryParams: IVinesSearchWorkflowExecutionsParams | null = null;

    if (lastQueryParams) {
      // 使用最后一次用户查询的参数
      queryParams = lastQueryParams;
    } else if (vines.workflowId) {
      // 使用初始参数 (等同于 handleSubmit(void 0, false) 的参数)
      queryParams = {
        workflowId: vines.workflowId,
        pagination: { page: 1, limit: workflowPageRef.current * 10 },
        workflowInstanceId: '',
      };
    }

    if (queryParams) {
      try {
        await trigger(queryParams);
      } catch (error) {
        console.warn('轮询查询失败:', error);
      }
    }

    // 递归设置下一次轮询
    if (isPolling && !isUserInteracting) {
      pollingTimeoutRef.current = setTimeout(startPolling, POLLING_INTERVAL);
    }
  }, [isPolling, isUserInteracting, lastQueryParams, vines.workflowId, trigger, workflowPageRef]);

  // 启动轮询
  const resumePolling = useCallback(() => {
    if (!isPolling || isUserInteracting) return;

    stopPolling();
    pollingTimeoutRef.current = setTimeout(startPolling, POLLING_INTERVAL);
  }, [isPolling, isUserInteracting, startPolling, stopPolling]);

  // 用户交互控制
  const handleUserInteractionStart = useCallback(() => {
    setIsUserInteracting(true);
    stopPolling();
  }, [stopPolling]);

  const handleUserInteractionEnd = useCallback(() => {
    setIsUserInteracting(false);
    // 延迟恢复轮询，避免频繁的交互触发
    setTimeout(() => {
      setIsUserInteracting(false);
    }, 1000);
  }, []);

  const handleSubmit = async (
    loadNextPage?: boolean,
    useToast = true,
  ): Promise<VinesWorkflowExecutionLists | undefined> => {
    if (vines.workflowId) {
      form.setValue('workflowId', vines.workflowId);
      if (loadNextPage) {
        workflowPageRef.current++;
      } else {
        workflowPageRef.current = 1;
      }
      form.setValue('pagination', {
        page: 1,
        limit: workflowPageRef.current * 10,
      });

      const result = new Promise((resolve) => {
        form.handleSubmit((params) => {
          // 保存查询参数
          setLastQueryParams(params);

          if (useToast) {
            toast.promise(trigger(params), {
              loading: t('workspace.logs-view.loading'),
              success: (res) => {
                resolve(res);
                // 启动轮询
                setIsPolling(true);
                return t('workspace.logs-view.success');
              },
              error: t('workspace.logs-view.error'),
            });
          } else {
            trigger(params).then((res) => {
              resolve(res);
              // 启动轮询
              setIsPolling(true);
            });
          }
        })();
      }) as Promise<VinesWorkflowExecutionLists | undefined>;

      return await result;
    }

    toast.warning(t('workspace.logs-view.workflow-id-error'));
    return;
  };

  const handleMutate = async () => {
    if (!vines.workflowId) {
      toast.warning(t('workspace.logs-view.workflow-id-error'));
      return;
    }

    // 设置与handleSubmit相同的参数处理逻辑
    form.setValue('workflowId', vines.workflowId);
    form.setValue('pagination', {
      page: 1,
      limit: workflowPageRef.current * 10,
    });

    // 使用form.handleSubmit确保获取完整的表单数据
    const params = await new Promise<IVinesSearchWorkflowExecutionsParams>((resolve) => {
      form.handleSubmit((formParams) => {
        resolve(formParams);
      })();
    });

    // 不保存参数，这是内部调用
    await trigger(params);
  };

  // 轮询控制 - 移除对组件可见性和页面隐藏的检查
  useEffect(() => {
    if (isPolling && !isUserInteracting) {
      resumePolling();
    } else {
      stopPolling();
    }
  }, [isPolling, isUserInteracting, resumePolling, stopPolling]);

  // 清理
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  useEffect(() => {
    if (vines.workflowId && visible) {
      void handleSubmit(void 0, false);
    }
    if (!visible) {
      vines.executionInstanceId = '';
      setActiveTab('');
      // 组件隐藏时不再停止轮询，轮询继续运行
    }
  }, [vines.workflowId, visible]);

  return (
    <div className="relative flex h-full max-h-full items-center">
      <motion.div
        initial={{ width: sidebarVisible ? 320 : 0, paddingRight: sidebarVisible ? 4 : 0 }}
        animate={{
          width: sidebarVisible ? 320 : 0,
          paddingRight: sidebarVisible ? 6 : 0,
        }}
      >
        <ScrollArea style={{ height: containerHeight }}>
          <VinesLogViewLogFilter
            form={form}
            handleSubmit={handleSubmit}
            isMutating={isMutating}
            onUserInteractionStart={handleUserInteractionStart}
            onUserInteractionEnd={handleUserInteractionEnd}
          />
        </ScrollArea>
      </motion.div>
      <Separator orientation="vertical" className="vines-center mx-4" style={{ height: containerHeight }}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className="group z-10 flex h-4 w-3.5 cursor-pointer items-center justify-center rounded-sm border bg-border px-0.5 transition-opacity hover:opacity-75 active:opacity-95"
              onClick={() => setSidebarVisible(!sidebarVisible)}
            >
              <ChevronRight className={cn(sidebarVisible && 'scale-x-[-1]')} />
            </div>
          </TooltipTrigger>
          <TooltipContent>{sidebarVisible ? t('common.sidebar.hide') : t('common.sidebar.show')}</TooltipContent>
        </Tooltip>
      </Separator>
      <div className="h-full flex-1">
        <VinesLogViewLogList
          searchWorkflowExecutionsData={searchWorkflowExecutionsData}
          handleSubmit={handleSubmit}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          height={containerHeight}
          mutate={handleMutate}
        />
      </div>
    </div>
  );
};
