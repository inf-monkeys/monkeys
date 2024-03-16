import React, { useEffect, useState } from 'react';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useFlowStore } from '@/store/useFlowStore';
import VinesEvent from '@/utils/events.ts';

interface ITriggerSelectorProps {}

export const TriggerSelector: React.FC<ITriggerSelectorProps> = () => {
  const { workflowId } = useFlowStore();

  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleOpen = (_wid: string) => {
      if (workflowId !== _wid) return;
      setOpen(true);
    };
    VinesEvent.on('flow-trigger-selector', handleOpen);
    return () => {
      VinesEvent.off('flow-trigger-selector', handleOpen);
    };
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogTitle>选择触发器</DialogTitle>
      </DialogContent>
    </Dialog>
  );
};
