import React, { useEffect, useState } from 'react';

import { useTranslation } from 'react-i18next';

import { WorkflowInputConfig } from '@/components/layout/workspace/vines-view/flow/headless-modal/endpoint/start-tool/workflow-input-config';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useFlowStore } from '@/store/useFlowStore';
import VinesEvent from '@/utils/events.ts';

interface IStartToolProps {}

export const StartTool: React.FC<IStartToolProps> = () => {
  const { t } = useTranslation();

  const workflowId = useFlowStore((s) => s.workflowId);

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
    <Dialog open={open} onOpenChange={setOpen} modal={false}>
      <DialogContent className="h-[38rem]">
        <DialogTitle>{t('workspace.flow-view.endpoint.start-tool.title')}</DialogTitle>
        <WorkflowInputConfig />
      </DialogContent>
    </Dialog>
  );
};
