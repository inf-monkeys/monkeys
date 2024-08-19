import React, { useEffect, useRef, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useMutationSearchWorkflowExecutions } from '@/apis/workflow/execution';
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
import { usePageStore } from '@/store/usePageStore';
import { useViewStore } from '@/store/useViewStore';
import { cn } from '@/utils';

export const VinesLogViewLogTab: React.FC = () => {
  const { t } = useTranslation();

  const visible = useViewStore((s) => s.visible);
  const containerHeight = usePageStore((s) => s.containerHeight);
  const workbenchVisible = usePageStore((s) => s.workbenchVisible);

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

  useEffect(() => {
    if (vines.workflowId && visible) {
      void handleSubmit();
    }
    if (!visible) {
      vines.executionInstanceId = '';
      setActiveTab('');
    }
  }, [vines.workflowId, visible]);

  const handleSubmit = (loadNextPage?: boolean) => {
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
      form.handleSubmit((params) => {
        toast.promise(trigger(params), {
          loading: t('workspace.logs-view.loading'),
          error: t('workspace.logs-view.error'),
        });
      })();
    } else {
      toast.warning(t('workspace.logs-view.workflow-id-error'));
    }
  };

  const finalHeight = containerHeight - 52 - 40;

  return (
    <div className="relative flex h-full max-h-full">
      <motion.div
        initial={{ width: sidebarVisible ? 320 : 0, paddingRight: sidebarVisible ? 4 : 0 }}
        animate={{
          width: sidebarVisible ? 320 : 0,
          paddingRight: sidebarVisible ? 6 : 0,
          transition: { duration: 0.2 },
        }}
      >
        <ScrollArea style={{ height: finalHeight }}>
          <VinesLogViewLogFilter form={form} handleSubmit={handleSubmit} isMutating={isMutating} />
        </ScrollArea>
      </motion.div>
      <Separator orientation="vertical" className="vines-center mx-4">
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
          height={finalHeight}
        />
      </div>
    </div>
  );
};
