import React, { useEffect, useState } from 'react';

import { MonkeyWorkflow } from '@inf-monkeys/monkeys';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useGetWorkflow, useUpdateWorkflow } from '@/apis/workflow';
import { Button } from '@/components/ui/button';
import { CodeEditor, JSONValue } from '@/components/ui/code-editor';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { useFlowStore } from '@/store/useFlowStore';
import { cn } from '@/utils';
import VinesEvent from '@/utils/events.ts';

interface IWorkflowRawDataEditorProps extends React.ComponentPropsWithoutRef<'div'> {}

export const WorkflowRawDataEditor: React.FC<IWorkflowRawDataEditorProps> = () => {
  const { t } = useTranslation();

  const isLatestWorkflowVersion = useFlowStore((s) => s.isLatestWorkflowVersion);
  const workflowId = useFlowStore((s) => s.workflowId);

  const { trigger } = useUpdateWorkflow(workflowId);

  const { data: workflow } = useGetWorkflow(workflowId);

  const [draft, setDraft] = useState<JSONValue>({});
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleOpen = (_wid: string) => {
      if (_wid !== workflowId) return;
      setOpen(true);
      setDraft((workflow ?? {}) as JSONValue);
    };

    VinesEvent.on('flow-raw-data-editor', handleOpen);
    return () => {
      VinesEvent.off('flow-raw-data-editor', handleOpen);
    };
  }, [workflowId, workflow]);

  const [error, setError] = useState<string | null>(null);
  const handleUpdate = (input: string) => {
    try {
      const value = JSON.parse(input);
      setDraft(value);
      setError(null);
    } catch {
      setError('JSON 格式错误，数据将不会保存');
    }
  };

  const handleSave = () => {
    setOpen(false);

    toast.promise(trigger(draft as unknown as MonkeyWorkflow), {
      loading: t('common.update.loading'),
      success: t('common.update.success'),
      error: t('common.update.error'),
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl">
        <DialogTitle>{t('workspace.flow-view.tooltip.raw-data.button')}</DialogTitle>
        <DialogDescription>{t('workspace.flow-view.tooltip.raw-data.desc')}</DialogDescription>

        <CodeEditor
          data={draft}
          onUpdate={handleUpdate}
          className="h-96 w-full"
          lineNumbers={3}
          readonly={!isLatestWorkflowVersion}
        />

        <DialogFooter className={cn(!isLatestWorkflowVersion && 'hidden')}>
          <div className="flex flex-1 items-center">{error && <p className="text-xs text-red-10">{error}</p>}</div>
          <Button variant="outline" onClick={() => setDraft((workflow ?? {}) as JSONValue)}>
            {t('workspace.flow-view.tooltip.raw-data.reset')}
          </Button>
          <Button variant="outline" onClick={handleSave} disabled={!!error}>
            {t('workspace.flow-view.tooltip.raw-data.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
