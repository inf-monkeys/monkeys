import React, { useEffect, useState } from 'react';

import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { useFlowStore } from '@/store/useFlowStore';
import VinesEvent from '@/utils/events.ts';

interface IWebhookTriggerProps extends React.ComponentPropsWithoutRef<'div'> {}

export const WebhookTrigger: React.FC<IWebhookTriggerProps> = () => {
  const { workflowId } = useFlowStore();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleOpen = (_wid: string) => {
      if (workflowId !== _wid) return;
      setOpen(true);
    };
    VinesEvent.on('flow-trigger-webhook', handleOpen);
    return () => {
      VinesEvent.off('flow-trigger-webhook', handleOpen);
    };
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogTitle>Webhook 触发器配置</DialogTitle>
        <DialogDescription>配置并启用 Webhook 触发器后，工作流将通过 HTTP 请求触发</DialogDescription>
      </DialogContent>
    </Dialog>
  );
};
