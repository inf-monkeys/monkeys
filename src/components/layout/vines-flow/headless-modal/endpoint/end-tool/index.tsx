import React, { useEffect, useState } from 'react';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import VinesEvent from '@/utils/events.ts';

interface IEndToolProps {}

export const EndTool: React.FC<IEndToolProps> = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleOpen = () => {
      setOpen(true);
    };
    VinesEvent.on('flow-end-tool', handleOpen);
    return () => {
      VinesEvent.off('flow-end-tool', handleOpen);
    };
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogTitle>工作流输出配置</DialogTitle>
      </DialogContent>
    </Dialog>
  );
};
