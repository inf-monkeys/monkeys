import React, { useEffect, useState } from 'react';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import VinesEvent from '@/utils/events.ts';

interface IStartToolProps {}

export const StartTool: React.FC<IStartToolProps> = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleOpen = () => {
      setOpen(true);
    };
    VinesEvent.on('flow-start-tool', handleOpen);
    return () => {
      VinesEvent.off('flow-start-tool', handleOpen);
    };
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogTitle>触发器与工作流输入</DialogTitle>
      </DialogContent>
    </Dialog>
  );
};
