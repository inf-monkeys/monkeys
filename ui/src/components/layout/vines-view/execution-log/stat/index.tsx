import React, { useEffect, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { exportSearchWorkflowExecutionStats, useMutationSearchWorkflowExecutionStats } from '@/apis/workflow/execution';
import { VinesLogViewStatChart } from '@/components/layout/vines-view/execution-log/stat/chart';
import { VinesLogViewStatFilter } from '@/components/layout/vines-view/execution-log/stat/filter';
import { VinesLogViewStatTable } from '@/components/layout/vines-view/execution-log/stat/table';
import { getDayBegin, getRelativeDate } from '@/components/layout/vines-view/execution-log/stat/utils.ts';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { Separator } from '@/components/ui/separator.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useVinesFlow } from '@/package/vines-flow';
import {
  IVinesSearchWorkflowExecutionStatParams,
  vinesSearchWorkflowExecutionStatSchema,
} from '@/schema/workspace/workflow-execution-stat.ts';
import { usePageStore } from '@/store/usePageStore';
import { useViewStore } from '@/store/useViewStore';
import { cn } from '@/utils';

interface IVinesLogViewStatTabProps {}

export const VinesLogViewStatTab: React.FC<IVinesLogViewStatTabProps> = () => {
  const { t } = useTranslation();

  const { visible } = useViewStore();
  const { containerHeight, workbenchVisible } = usePageStore();
  const { vines } = useVinesFlow();

  const [sidebarVisible, setSidebarVisible] = useState(!workbenchVisible);

  const now = new Date();

  const today = getDayBegin(now);

  const defaultValues = {
    startTimestamp: getRelativeDate(today, -7).getTime(),
    endTimestamp: today.getTime(),
  };

  const form = useForm<IVinesSearchWorkflowExecutionStatParams>({
    resolver: zodResolver(vinesSearchWorkflowExecutionStatSchema),
    defaultValues,
  });

  const {
    data: searchWorkflowExecutionStatData,
    trigger,
    isMutating,
  } = useMutationSearchWorkflowExecutionStats(vines.workflowId);

  useEffect(() => {
    if (vines.workflowId && visible) {
      void handleSubmit();
    }
  }, [vines.workflowId, visible]);

  const handleSubmit = () => {
    if (vines.workflowId) {
      console.log(vines.workflowId);
      form.handleSubmit((params) => {
        console.log(params);
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

  const handleDownload = () => {
    if (!vines.workflowId) {
      toast.warning('common.toast.loading');
      return;
    }
    toast.promise(
      exportSearchWorkflowExecutionStats(vines.workflowId, {
        ...form.getValues(),
        format: 'csv',
      }),
      {
        loading: t('workspace.logs-view.stat.toast.export.loading'),
        success: t('workspace.logs-view.stat.toast.export.success'),
        error: t('workspace.logs-view.stat.toast.export.error'),
      },
    );
  };

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
          <div className="flex flex-col gap-2">
            <VinesLogViewStatFilter form={form} handleSubmit={handleSubmit} isMutating={isMutating} />
            <Button onClick={handleDownload} theme="tertiary" className="mx-2 flex-1" disabled={isMutating}>
              {t('workspace.logs-view.stat.filter.form.export')}
            </Button>
          </div>
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
        <ScrollArea className="pr-1 [&>div>div]:h-full" style={{ height: finalHeight }}>
          <div className="mx-4 flex flex-col gap-3">
            <VinesLogViewStatChart
              handleSubmit={handleSubmit}
              searchWorkflowExecutionStatData={searchWorkflowExecutionStatData}
            />
            <VinesLogViewStatTable
              handleSubmit={handleSubmit}
              searchWorkflowExecutionStatData={searchWorkflowExecutionStatData}
            />
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};
