import React, { useEffect, useState } from 'react';

import { useSWRConfig } from 'swr';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { useTriggerCreate } from '@/apis/workflow/trigger';
import { WorkflowTriggerType } from '@/apis/workflow/trigger/typings.ts';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form.tsx';
import { Input } from '@/components/ui/input';
import { useVinesFlow } from '@/package/vines-flow';
import {
  IWorkflowTriggerSchedule,
  workflowTriggerScheduleSchema,
} from '@/schema/workspace/workflow-trigger-schedule.ts';
import { usePageStore } from '@/store/usePageStore';
import VinesEvent from '@/utils/events.ts';

interface IScheduleTriggerProps {}

export const ScheduleTrigger: React.FC<IScheduleTriggerProps> = () => {
  const { workflowId } = usePageStore();
  const { mutate } = useSWRConfig();

  const [open, setOpen] = useState(false);

  const { vines } = useVinesFlow();
  const { trigger } = useTriggerCreate(workflowId);

  const workflowVersion = vines.version;

  const form = useForm<IWorkflowTriggerSchedule>({
    resolver: zodResolver(workflowTriggerScheduleSchema),
    defaultValues: {
      cron: '* * * * */1',
    },
  });

  useEffect(() => {
    const handleOpen = (_wid: string) => {
      if (workflowId !== _wid) return;
      setOpen(true);
    };
    VinesEvent.on('flow-trigger-schedule', handleOpen);
    return () => {
      VinesEvent.off('flow-trigger-schedule', handleOpen);
    };
  }, []);

  const handleSubmit = form.handleSubmit((data) => {
    toast.promise(
      trigger({
        triggerType: WorkflowTriggerType.SCHEDULER,
        enabled: false,
        cron: data.cron,
        version: workflowVersion,
      }),
      {
        loading: '创建中...',
        success: () => {
          void mutate(`/api/workflow/${workflowId}/triggers?version=${workflowVersion}`);
          return '触发器创建成功';
        },
        error: '创建失败',
      },
    );
    setOpen(false);
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogTitle>定时触发器</DialogTitle>
        <DialogDescription>配置并启用定时触发器后，工作流将按照配置的时间周期性地触发</DialogDescription>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <FormField
              name="cron"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>corn 表达式</FormLabel>
                  <FormControl>
                    <Input placeholder="请输入 cron 定时任务表达式" {...field} className="grow" autoFocus />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button variant="outline" type="submit">
                创建
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
