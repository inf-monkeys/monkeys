import React, { useEffect, useMemo, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { MonkeyWorkflow } from '@inf-monkeys/monkeys';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { updateWorkflow } from '@/apis/workflow';
import { useVinesPage } from '@/components/layout-wrapper/workspace/utils.ts';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form.tsx';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea.tsx';
import { VinesIconEditor } from '@/components/ui/vines-icon/editor.tsx';
import { IWorkflowInfo, workflowInfoSchema } from '@/schema/workspace/workflow-info.ts';
import { getI18nContent } from '@/utils';

interface IWorkflowInfoEditorProps {
  workflow?: MonkeyWorkflow;
  children?: React.ReactNode;
  visible?: boolean;
  setVisible?: (v: boolean) => void;
  afterUpdate?: () => void;
}

export const WorkflowInfoEditor: React.FC<IWorkflowInfoEditorProps> = ({
  workflow: propWorkflow,
  children,
  visible,
  setVisible,
  afterUpdate,
}) => {
  const { t } = useTranslation();

  const { workflow: vinesPageWorkflow, mutateWorkflow } = useVinesPage();

  const [open, setOpen] = useState(visible ?? false);
  const [isLoading, setIsLoading] = useState(false);

  useMemo(() => {
    typeof visible != 'undefined' && setOpen(visible);
  }, [visible]);

  useMemo(() => {
    if (typeof setVisible != 'undefined') {
      setTimeout(() => {
        setVisible(open);
      });
    }
  }, [open]);

  const workflow = propWorkflow || vinesPageWorkflow;

  const form = useForm<IWorkflowInfo>({
    resolver: zodResolver(workflowInfoSchema),
    defaultValues: {
      displayName:
        getI18nContent(workflow?.displayName) ?? t('workspace.wrapper.workflow-info-card.default-workflow-name'),
      description: getI18nContent(workflow?.description) ?? '',
      iconUrl: workflow?.iconUrl ?? 'emoji:🍀:#ceefc5',
    },
  });

  useEffect(() => {
    if (!workflow) return;
    form.setValue(
      'displayName',
      getI18nContent(workflow.displayName) || t('workspace.wrapper.workflow-info-card.default-workflow-name'),
    );
    form.setValue('description', getI18nContent(workflow.description) || '');
    form.setValue('iconUrl', workflow.iconUrl || 'emoji:🍀:#ceefc5');
  }, [workflow]);

  const handleSubmit = form.handleSubmit(async (data) => {
    setIsLoading(true);
    if (!workflow?.workflowId) {
      setIsLoading(false);
      toast.error(t('workspace.wrapper.workflow-info-card.workflow-id-empty'));
      return;
    }
    const newWorkflow = await updateWorkflow(workflow?.workflowId, workflow?.version ?? 1, data);
    if (newWorkflow) {
      afterUpdate ? afterUpdate() : await mutateWorkflow();
      setOpen(false);
      setIsLoading(false);
      toast.success(t('workspace.wrapper.workflow-info-card.workflow-updated'));
    } else {
      toast.error(t('workspace.wrapper.workflow-info-card.workflow-update-failed'));
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('workspace.wrapper.workflow-info-card.title')}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <FormField
              name="displayName"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('workspace.wrapper.workflow-info-card.form.workflow-name')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('workspace.wrapper.workflow-info-card.form.workflow-name-placeholder')}
                      {...field}
                      className="grow"
                      autoFocus
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name="description"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('workspace.wrapper.workflow-info-card.form.workflow-desc')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('workspace.wrapper.workflow-info-card.form.workflow-desc-placeholder')}
                      className="h-28 resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name="iconUrl"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('workspace.wrapper.workflow-info-card.form.workflow-icon')}</FormLabel>
                  <FormControl>
                    <VinesIconEditor value={field.value} defaultValue={workflow?.iconUrl} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" loading={isLoading} variant="solid">
                {t('workspace.wrapper.workflow-info-card.form.submit')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
