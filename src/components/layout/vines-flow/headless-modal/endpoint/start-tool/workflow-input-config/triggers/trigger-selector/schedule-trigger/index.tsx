import React, { useEffect, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  IWorkflowTriggerSchedule,
  workflowTriggerScheduleSchema,
} from '@/schema/workspace/workflow-trigger-schedule.ts';
import { useFlowStore } from '@/store/useFlowStore';
import VinesEvent from '@/utils/events.ts';

interface IScheduleTriggerProps {}

export const ScheduleTrigger: React.FC<IScheduleTriggerProps> = () => {
  const { workflowId } = useFlowStore();
  const [open, setOpen] = useState(false);

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

  const [cronInput, setCronInput] = useState('');

  const handleCreate = () => {};

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogTitle>定时触发器</DialogTitle>
        <DialogDescription>配置并启用定时触发器后，工作流将按照配置的时间周期性地触发</DialogDescription>
        <Input placeholder="请输入 cron 定时任务表达式" value={cronInput} onChange={setCronInput} />
        <DialogFooter>
          <Button variant="outline" onClick={handleCreate}>
            创建
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
