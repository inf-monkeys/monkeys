import React, { useEffect, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { MonkeyWorkflow } from '@inf-monkeys/monkeys';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { updateWorkflow } from '@/apis/workflow';
import { useVinesOriginWorkflow } from '@/components/layout-wrapper/workspace/utils.ts';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form.tsx';
import { I18nInput } from '@/components/ui/i18n-input';
import { I18nTextarea } from '@/components/ui/i18n-textarea';
import { VinesIconEditor } from '@/components/ui/vines-icon/editor.tsx';
import { DEFAULT_WORKFLOW_ICON_URL } from '@/consts/icons.ts';
import { IWorkflowInfo, workflowInfoSchema } from '@/schema/workspace/workflow-info.ts';

interface IWorkflowInfoEditorProps {
  workflow?: MonkeyWorkflow;
  children?: React.ReactNode;
  visible?: boolean;
  setVisible?: (v: boolean) => void;
  afterUpdate?: () => void;
  disabled?: boolean;
}

export const WorkflowInfoEditor: React.FC<IWorkflowInfoEditorProps> = ({
  workflow: propWorkflow,
  children,
  visible,
  setVisible,
  afterUpdate,
  disabled,
}) => {
  const { t } = useTranslation();

  const { workflow: vinesPageWorkflow, mutateWorkflow } = useVinesOriginWorkflow();

  const [open, setOpen] = useState(visible ?? false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    typeof visible != 'undefined' && setOpen(visible);
  }, [visible]);

  useEffect(() => {
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
        (workflow?.displayName as string | Record<string, string>) ??
        t('workspace.wrapper.workflow-info-card.default-workflow-name'),
      description: (workflow?.description as string | Record<string, string>) ?? '',
      iconUrl: workflow?.iconUrl ?? DEFAULT_WORKFLOW_ICON_URL,
    },
  });

  useEffect(() => {
    if (!workflow) return;
    form.reset({
      displayName:
        (workflow.displayName as string | Record<string, string>) ||
        t('workspace.wrapper.workflow-info-card.default-workflow-name'),
      description: (workflow.description as string | Record<string, string>) || '',
      iconUrl: workflow.iconUrl || DEFAULT_WORKFLOW_ICON_URL,
    });
  }, [workflow, form, t]);

  const handleSubmit = form.handleSubmit(async (data) => {
    if (disabled) return;

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
    <Dialog open={open} onOpenChange={disabled ? void 0 : setOpen}>
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
                    <I18nInput
                      value={field.value}
                      onChange={field.onChange}
                      placeholder={t('workspace.wrapper.workflow-info-card.form.workflow-name-placeholder')}
                      autoFocus
                      dialogTitle={t('workspace.wrapper.workflow-info-card.form.workflow-name')}
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
                    <I18nTextarea
                      value={field.value}
                      onChange={field.onChange}
                      placeholder={t('workspace.wrapper.workflow-info-card.form.workflow-desc-placeholder')}
                      className="h-28 resize-none"
                      dialogTitle={t('workspace.wrapper.workflow-info-card.form.workflow-desc')}
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
                    <VinesIconEditor
                      value={field.value ?? DEFAULT_WORKFLOW_ICON_URL}
                      defaultValue={workflow?.iconUrl}
                      onChange={field.onChange}
                    />
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
