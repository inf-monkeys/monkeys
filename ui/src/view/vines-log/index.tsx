import React, { useEffect, useRef } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useElementSize } from '@mantine/hooks';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { VinesLogFilter } from 'src/components/layout/vines-view/execution-log/filter';
import { VinesLogList } from 'src/components/layout/vines-view/execution-log/list';

import { useMutationSearchWorkflowExecutions } from '@/apis/workflow/execution';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { Separator } from '@/components/ui/separator.tsx';
import { useVinesFlow } from '@/package/vines-flow';
import {
  IVinesSearchWorkflowExecutionsParams,
  vinesSearchWorkflowExecutionsSchema,
} from '@/schema/workspace/workflow-execution.ts';
import { useViewStore } from '@/store/useViewStore';

export const VinesLogView: React.FC = () => {
  const { t } = useTranslation();

  const { visible } = useViewStore();
  const { vines } = useVinesFlow();

  const { ref, height } = useElementSize();

  const form = useForm<IVinesSearchWorkflowExecutionsParams>({
    resolver: zodResolver(vinesSearchWorkflowExecutionsSchema),
    defaultValues: {
      workflowInstanceId: '',
    },
  });

  const { data: searchWorkflowExecutionsData, trigger, isMutating } = useMutationSearchWorkflowExecutions();

  const workflowPageRef = useRef(1);
  const workflowDefinitions = searchWorkflowExecutionsData?.definitions;
  const workflowExecutions = searchWorkflowExecutionsData?.data;
  const workflowTotal = searchWorkflowExecutionsData?.total;

  useEffect(() => {
    if (vines.workflowId && visible) {
      void handleSubmit();
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

  const finalHeight = height - 108;

  return (
    <main ref={ref} className="flex h-full max-h-full flex-col gap-2 p-6">
      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold tracking-tight">{t('workspace.logs-view.title')}</h2>
        <p className="text-muted-foreground">
          {t('workspace.logs-view.desc', {
            data: workflowTotal?.toString() ?? '-',
            suffix:
              workflowExecutions && workflowDefinitions
                ? t('workspace.logs-view.desc-suffix', { loaded: workflowExecutions.length?.toString() ?? '-' })
                : '',
          })}
        </p>
      </div>
      <Separator className="my-4" />
      <div className="flex h-full gap-4">
        <div className="w-2/5 max-w-80">
          <ScrollArea style={{ height: finalHeight }}>
            <VinesLogFilter form={form} handleSubmit={handleSubmit} isMutating={isMutating} />
          </ScrollArea>
        </div>
        <div className="h-full flex-1">
          <ScrollArea className="[&>div>div]:h-full" style={{ height: finalHeight }}>
            <VinesLogList searchWorkflowExecutionsData={searchWorkflowExecutionsData} handleSubmit={handleSubmit} />
          </ScrollArea>
        </div>
      </div>
    </main>
  );
};
