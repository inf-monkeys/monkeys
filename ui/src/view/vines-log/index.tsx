import React, { useEffect, useRef } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
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
import { usePageStore } from '@/store/usePageStore';
import { useViewStore } from '@/store/useViewStore';
import { cn } from '@/utils';

export const VinesLogView: React.FC = () => {
  const { t } = useTranslation();

  const { visible } = useViewStore();
  const { containerHeight, workbenchVisible } = usePageStore();
  const { vines } = useVinesFlow();

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

  const finalHeight = containerHeight - 52;

  return (
    <main className={cn('relative flex h-full max-h-full p-6', workbenchVisible && 'p-0 pl-4')}>
      <div className="w-2/5 max-w-80">
        <ScrollArea style={{ height: finalHeight }}>
          <VinesLogFilter form={form} handleSubmit={handleSubmit} isMutating={isMutating} />
        </ScrollArea>
      </div>
      <Separator className="mx-4" orientation="vertical" />
      <div className="h-full flex-1">
        <ScrollArea className="[&>div>div]:h-full" style={{ height: finalHeight }}>
          <VinesLogList searchWorkflowExecutionsData={searchWorkflowExecutionsData} handleSubmit={handleSubmit} />
        </ScrollArea>
      </div>
    </main>
  );
};
