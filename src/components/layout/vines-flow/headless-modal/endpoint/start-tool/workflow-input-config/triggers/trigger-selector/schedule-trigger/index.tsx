import React, { useEffect, useState } from 'react';

import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { useFlowStore } from '@/store/useFlowStore';
import VinesEvent from '@/utils/events.ts';

interface IScheduleTriggerProps {}

export const ScheduleTrigger: React.FC<IScheduleTriggerProps> = () => {
  const { workflowId } = useFlowStore();
  const [open, setOpen] = useState(false);

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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogTitle>定时触发器</DialogTitle>
        <DialogDescription>配置并启用定时触发器后，工作流将按照配置的时间周期性地触发</DialogDescription>
      </DialogContent>
    </Dialog>
  );
};
