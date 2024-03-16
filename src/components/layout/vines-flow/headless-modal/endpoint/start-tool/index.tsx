import React, { useEffect, useState } from 'react';

import { WorkflowInputConfig } from '@/components/layout/vines-flow/headless-modal/endpoint/start-tool/workflow-input-config';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useFlowStore } from '@/store/useFlowStore';
import VinesEvent from '@/utils/events.ts';

interface IStartToolProps {}

export const StartTool: React.FC<IStartToolProps> = () => {
  const { workflowId } = useFlowStore();

  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleOpen = (_wid: string) => {
      if (workflowId !== _wid) return;
      setOpen(true);
    };
    VinesEvent.on('flow-start-tool', handleOpen);
    return () => {
      VinesEvent.off('flow-start-tool', handleOpen);
    };
  }, [workflowId]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogTitle>触发器与工作流输入</DialogTitle>
        <WorkflowInputConfig />
      </DialogContent>
    </Dialog>
  );
};
