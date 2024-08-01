import React, { useEffect, useState } from 'react';

import { useSWRConfig } from 'swr';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
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
import { useFlowStore } from '@/store/useFlowStore';
import VinesEvent from '@/utils/events.ts';

interface IScheduleTriggerProps {}

export const ScheduleTrigger: React.FC<IScheduleTriggerProps> = () => {
  const { t } = useTranslation();

  const { mutate } = useSWRConfig();

  const workflowId = useFlowStore((s) => s.workflowId);

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
        loading: t('workspace.flow-view.endpoint.start-tool.trigger.create.schedule-trigger.loading'),
        success: () => {
          void mutate(`/api/workflow/${workflowId}/triggers?version=${workflowVersion}`);
          return t('workspace.flow-view.endpoint.start-tool.trigger.create.schedule-trigger.success');
        },
        error: t('workspace.flow-view.endpoint.start-tool.trigger.create.schedule-trigger.error'),
      },
    );
    setOpen(false);
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogTitle>{t('workspace.flow-view.endpoint.start-tool.trigger.create.schedule-trigger.title')}</DialogTitle>
        <DialogDescription>
          {t('workspace.flow-view.endpoint.start-tool.trigger.create.schedule-trigger.desc')}
        </DialogDescription>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <FormField
              name="cron"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('workspace.flow-view.endpoint.start-tool.trigger.create.schedule-trigger.form.cron.label')}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t(
                        'workspace.flow-view.endpoint.start-tool.trigger.create.schedule-trigger.form.cron.placeholder',
                      )}
                      {...field}
                      className="grow"
                      autoFocus
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button variant="outline" type="submit">
                {t('workspace.flow-view.endpoint.start-tool.trigger.create.schedule-trigger.form.submit')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
