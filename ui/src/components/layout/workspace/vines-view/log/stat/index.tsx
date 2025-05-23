import React, { useEffect, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { exportSearchWorkflowExecutionStats, useMutationSearchWorkflowExecutionStats } from '@/apis/workflow/execution';
import { VinesLogViewStatChart } from '@/components/layout/workspace/vines-view/log/stat/chart';
import { VinesLogViewStatFilter } from '@/components/layout/workspace/vines-view/log/stat/filter';
import { getDayBegin, getDayEnd, getRelativeDate } from '@/components/layout/workspace/vines-view/log/stat/utils.ts';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { Separator } from '@/components/ui/separator.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  IVinesSearchWorkflowExecutionStatParams,
  vinesSearchWorkflowExecutionStatSchema,
} from '@/schema/workspace/workflow-execution-stat.ts';
import { useFlowStore } from '@/store/useFlowStore';
import { cn } from '@/utils';

interface IVinesLogViewStatTabProps {
  visible: boolean;
  workbenchVisible: boolean;
  containerHeight: number;
}

export const VinesLogViewStatTab: React.FC<IVinesLogViewStatTabProps> = ({
  visible,
  workbenchVisible,
  containerHeight,
}) => {
  const { t } = useTranslation();

  const workflowId = useFlowStore((s) => s.workflowId);

  const [sidebarVisible, setSidebarVisible] = useState(!workbenchVisible);

  const now = new Date();

  const today = getDayBegin(now);
  const todayEnd = getDayEnd(now);

  const defaultValues = {
    startTimestamp: getRelativeDate(today, -7).getTime(),
    endTimestamp: todayEnd.getTime(),
  };

  const form = useForm<IVinesSearchWorkflowExecutionStatParams>({
    resolver: zodResolver(vinesSearchWorkflowExecutionStatSchema),
    defaultValues,
  });

  const {
    data: searchWorkflowExecutionStatData,
    trigger,
    isMutating,
  } = useMutationSearchWorkflowExecutionStats({
    workflowId,
  });

  useEffect(() => {
    if (workflowId && visible) {
      void handleSubmit();
    }
  }, [workflowId, visible]);

  const handleSubmit = () => {
    if (workflowId) {
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

  const handleDownload = () => {
    if (!workflowId) {
      toast.warning('common.toast.loading');
      return;
    }
    toast.promise(
      exportSearchWorkflowExecutionStats(
        {
          workflowId,
        },
        {
          ...form.getValues(),
          format: 'csv',
        },
      ),
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
        }}
      >
        <ScrollArea style={{ height: containerHeight }}>
          <div className="flex flex-col gap-2">
            <VinesLogViewStatFilter form={form} handleSubmit={handleSubmit} isMutating={isMutating} />
            <Button onClick={handleDownload} variant="outline" className="mx-2 flex-1" disabled={isMutating}>
              {t('workspace.logs-view.stat.filter.form.export')}
            </Button>
          </div>
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
        <ScrollArea className="pr-1 [&>div>div]:h-full" style={{ height: containerHeight }} disabledOverflowMask>
          <div className="mx-4 flex flex-col gap-3">
            <VinesLogViewStatChart
              handleSubmit={handleSubmit}
              searchWorkflowExecutionStatData={searchWorkflowExecutionStatData?.map((data) => {
                return {
                  ...data,
                  averageTime: parseFloat((data.averageTime / 1000).toFixed(2)),
                };
              })}
            />
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};
