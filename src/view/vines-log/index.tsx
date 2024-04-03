import React, { useEffect, useRef } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { ScrollArea } from '@mantine/core';
import { useElementSize } from '@mantine/hooks';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { useMutationSearchWorkflowExecutions } from '@/apis/workflow/execution';
import { VinesLogFilter } from '@/components/layout/view/vines-log/filter';
import { VinesLogList } from '@/components/layout/view/vines-log/list';
import { Separator } from '@/components/ui/separator.tsx';
import { useVinesFlow } from '@/package/vines-flow';
import {
  IVinesSearchWorkflowExecutionsParams,
  vinesSearchWorkflowExecutionsSchema,
} from '@/schema/workspace/workflow-execution.ts';
import { useViewStore } from '@/store/useViewStore';

export const VinesLogView: React.FC = () => {
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
          loading: '查询中...',
          error: '查询失败，请检查网络是否通畅',
        });
      })();
    } else {
      toast.warning('请等待页面加载完毕');
    }
  };

  const finalHeight = height - 108;

  return (
    <main ref={ref} className="flex h-full max-h-full flex-col gap-2 p-6">
      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold tracking-tight">日志视图</h2>
        <p className="text-muted-foreground">
          {`共 ${workflowTotal ?? '-'} 项${(workflowExecutions && workflowDefinitions && `，已加载 ${workflowExecutions.length ?? '-'} 项`) || ''}`}
        </p>
      </div>
      <Separator className="my-4" />
      <div className="flex gap-4">
        <div className="w-[300px]">
          <ScrollArea style={{ height: finalHeight }}>
            <VinesLogFilter form={form} handleSubmit={handleSubmit} isMutating={isMutating} />
          </ScrollArea>
        </div>
        <div className="h-full flex-1">
          <ScrollArea style={{ height: finalHeight }}>
            <VinesLogList searchWorkflowExecutionsData={searchWorkflowExecutionsData} handleSubmit={handleSubmit} />
          </ScrollArea>
        </div>
      </div>
    </main>
  );
};
