import React, { useEffect, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useLatest } from 'ahooks';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { IWorkflowAssociation } from '@/apis/workflow/association/typings';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Form } from '@/components/ui/form.tsx';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { IWorkflowAssociationForEditor, workflowAssociationSchema } from '@/schema/workspace/workflow-association';
import VinesEvent from '@/utils/events.ts';

import { FieldDescription } from './field/description';
import { FieldDisplayName } from './field/display-name';

interface IWorkflowAssociationEditorProps { }

export const WorkflowAssociationEditor: React.FC<IWorkflowAssociationEditorProps> = () => {
  const { t } = useTranslation();

  const [open, setOpen] = useState(false);

  const form = useForm<IWorkflowAssociationForEditor>({
    resolver: zodResolver(workflowAssociationSchema),
    defaultValues: {
      enabled: true,
      mapper: [],
    },
  });

  useEffect(() => {
    const handleOpen = (association: IWorkflowAssociation) => {
      form.reset(association as IWorkflowAssociationForEditor);
      setOpen(true);
    };
    VinesEvent.on('flow-association-editor', handleOpen);
    return () => {
      VinesEvent.off('flow-association-editor', handleOpen);
    };
  }, []);

  const handleSubmit = form.handleSubmit((data) => {
    console.log(data);

    setOpen(false);
  });

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
        <DialogTitle>{t('workspace.flow-view.endpoint.start-tool.input.config-form.title')}</DialogTitle>
        <Form {...form}>
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-2"
            onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
          >
            <div className="flex gap-2">
              <ScrollArea className="-mx-3 h-[25rem] px-3">
                <div className="flex w-96 max-w-md flex-col gap-2 px-1">
                  <FieldDisplayName form={form} />
                  <FieldDescription form={form} />
                </div>
              </ScrollArea>
            </div>

            <DialogFooter>
              <Button ref={submitButtonRef} type="submit" variant="outline">
                {t('workspace.flow-view.endpoint.start-tool.input.config-form.submit')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
