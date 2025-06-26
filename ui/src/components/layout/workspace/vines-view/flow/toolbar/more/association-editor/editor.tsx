import React, { useEffect, useState } from 'react';

import { useSWRConfig } from 'swr';

import { zodResolver } from '@hookform/resolvers/zod';
import { useLatest } from 'ahooks';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { createWorkflowAssociation, updateWorkflowAssociation } from '@/apis/workflow/association';
import { IWorkflowAssociation } from '@/apis/workflow/association/typings';
import { AssociationEditorFields } from '@/components/layout/workspace/vines-view/flow/toolbar/more/association-editor/field';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Form } from '@/components/ui/form.tsx';
import { IWorkflowAssociationForEditor, workflowAssociationSchema } from '@/schema/workspace/workflow-association';
import { useFlowStore } from '@/store/useFlowStore';
import VinesEvent from '@/utils/events.ts';

interface IWorkflowAssociationEditorProps {}

export const WorkflowAssociationEditor: React.FC<IWorkflowAssociationEditorProps> = () => {
  const { t } = useTranslation();

  const [open, setOpen] = useState(false);

  const { mutate } = useSWRConfig();

  const form = useForm<IWorkflowAssociationForEditor>({
    resolver: zodResolver(workflowAssociationSchema),
    defaultValues: {
      enabled: true,
      type: 'to-workflow',
      displayName: '',
      description: '',
      mapper: [],
    },
  });

  const { workflowId } = useFlowStore();

  const [aid, setAid] = useState<string | undefined>();

  const [mode, setMode] = useState<'create' | 'update'>('create');

  useEffect(() => {
    const handleOpen = (association: IWorkflowAssociation, mode: 'create' | 'update' = 'create') => {
      setMode(mode);
      if (mode === 'update') {
        form.reset(association as IWorkflowAssociationForEditor);
        setAid(association.id);
      }
      if (mode === 'create') {
        form.reset();
        setAid(undefined);
      }
      setOpen(true);
    };
    VinesEvent.on('flow-association-editor', handleOpen);
    return () => {
      VinesEvent.off('flow-association-editor', handleOpen);
    };
  }, []);

  const handleSubmit = form.handleSubmit(
    (data) => {
      if (mode === 'update') {
        if (!workflowId || !aid) {
          toast.warning(t('common.toast.loading'));
          return;
        }
        toast.promise(updateWorkflowAssociation(workflowId, aid, data), {
          loading: t('common.update.loading'),
          error: t('common.update.error'),
          success: () => {
            void mutate((key) => typeof key === 'string' && key.startsWith(`/api/workflow/${workflowId}/associations`));
            setAid(undefined);
            setMode('create');
            setOpen(false);
            form.reset();
            return t('common.update.success');
          },
        });
      }
      if (mode === 'create') {
        toast.promise(createWorkflowAssociation(workflowId, data), {
          loading: t('common.create.loading'),
          error: t('common.create.error'),
          success: () => {
            void mutate((key) => typeof key === 'string' && key.startsWith(`/api/workflow/${workflowId}/associations`));
            setAid(undefined);
            setMode('create');
            setOpen(false);
            form.reset();
            return t('common.create.success');
          },
        });
      }
    },
    (errors) => {
      console.error('Form validation errors:', errors);
    },
  );

  const submitButtonRef = React.useRef<HTMLButtonElement>(null);

  const openLatest = useLatest(open);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="w-auto max-w-6xl"
        onPointerDownOutside={(e) => {
          if (e.target instanceof Element && e.target.closest('[data-sonner-toast]')) {
            e.preventDefault();
          }
          if ((e.target as HTMLDivElement).getAttribute('data-vines-overlay')) {
            setTimeout(() => {
              if (!openLatest.current) {
                submitButtonRef.current?.click();
              }
            });
          }
        }}
      >
        <DialogTitle>{t('workspace.flow-view.tooltip.more.association-editor.editor.title')}</DialogTitle>
        <Form {...form}>
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-2"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
              }
            }}
          >
            <AssociationEditorFields form={form} />
            <DialogFooter>
              <div className="flex items-center gap-2">
                <Button ref={submitButtonRef} type="submit" variant="outline">
                  {mode === 'create' ? t('common.utils.create') : t('common.utils.save')}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
