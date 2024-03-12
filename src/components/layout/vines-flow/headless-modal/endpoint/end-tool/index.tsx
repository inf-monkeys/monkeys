import React, { useEffect, useState } from 'react';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useFlowStore } from '@/store/useFlowStore';
import VinesEvent from '@/utils/events.ts';

interface IEndToolProps {}

export const EndTool: React.FC<IEndToolProps> = () => {
  const { workflowId } = useFlowStore();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleOpen = (_wid: string) => {
      if (workflowId !== _wid) return;

      setOpen(true);
    };
    VinesEvent.on('flow-end-tool', handleOpen);
    return () => {
      VinesEvent.off('flow-end-tool', handleOpen);
    };
  }, [workflowId]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogTitle>工作流输出配置</DialogTitle>
      </DialogContent>
    </Dialog>
  );
};
