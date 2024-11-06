import React, { useEffect, useRef, useState } from 'react';

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

export const VinesLogViewLogTab: React.FC<IVinesLogViewLogTabProps> = ({
  visible,
  workbenchVisible,
  containerHeight,
}) => {
  const { t } = useTranslation();

  const { vines } = useVinesFlow();

  const [sidebarVisible, setSidebarVisible] = useState(!workbenchVisible);
  const [activeTab, setActiveTab] = useState('');

  const form = useForm<IVinesSearchWorkflowExecutionsParams>({
    resolver: zodResolver(vinesSearchWorkflowExecutionsSchema),
    defaultValues: {
      workflowInstanceId: '',
    },
  });

  const { data: searchWorkflowExecutionsData, trigger, isMutating } = useMutationSearchWorkflowExecutions();

  const workflowPageRef = useRef(1);

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
          if (useToast) {
            toast.promise(trigger(params), {
              loading: t('workspace.logs-view.loading'),
              success: (res) => {
                resolve(res);
                return t('workspace.logs-view.success');
              },
              error: t('workspace.logs-view.error'),
            });
          } else {
            trigger(params).then((it) => resolve(it));
          }
        })();
      }) as Promise<VinesWorkflowExecutionLists | undefined>;

      return await result;
    }

    toast.warning(t('workspace.logs-view.workflow-id-error'));
    return;
  };

  useEffect(() => {
    if (vines.workflowId && visible) {
      void handleSubmit(void 0, false);
    }
    if (!visible) {
      vines.executionInstanceId = '';
      setActiveTab('');
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
          <VinesLogViewLogFilter form={form} handleSubmit={handleSubmit} isMutating={isMutating} />
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
        />
      </div>
    </div>
  );
};
