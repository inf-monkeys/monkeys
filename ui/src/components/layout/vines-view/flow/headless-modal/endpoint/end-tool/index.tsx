import React, { useEffect, useState } from 'react';

import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useUpdateWorkflow } from '@/apis/workflow';
import {
  IVinesOutputData,
  WorkflowOutputConfig,
} from '@/components/layout/vines-view/flow/headless-modal/endpoint/end-tool/workflow-output-config';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { useVinesFlow } from '@/package/vines-flow';
import { useCanvasStore } from '@/store/useCanvasStore';
import { useFlowStore } from '@/store/useFlowStore';
import { cn } from '@/utils';
import VinesEvent from '@/utils/events.ts';

interface IEndToolProps {}

export const EndTool: React.FC<IEndToolProps> = () => {
  const { t } = useTranslation();

  const { isLatestWorkflowVersion, workflowId } = useFlowStore();
  const { disableDialogClose } = useCanvasStore();

  const [open, setOpen] = useState(false);

  const { vines } = useVinesFlow();
  const { trigger } = useUpdateWorkflow(workflowId ?? '');

  const [output, setOutput] = useState<IVinesOutputData[]>([]);

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

  const handleUpdate = () => {
    toast.promise(trigger({ output, version: vines.version }), {
      loading: t('workspace.flow-view.endpoint.end-tool.save.loading'),
      success: t('workspace.flow-view.endpoint.end-tool.save.success'),
      error: t('workspace.flow-view.endpoint.end-tool.save.error'),
    });
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !disableDialogClose && setOpen(val)}>
      <DialogContent>
        <DialogTitle>{t('workspace.flow-view.endpoint.end-tool.title')}</DialogTitle>
        <WorkflowOutputConfig output={output} setOutput={setOutput} />
        <DialogFooter className={cn(!isLatestWorkflowVersion && 'hidden')}>
          <Button variant="outline" onClick={handleUpdate}>
            {t('workspace.flow-view.endpoint.end-tool.save.button')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
