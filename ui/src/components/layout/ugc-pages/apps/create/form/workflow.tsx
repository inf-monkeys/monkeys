import React, { useState } from 'react';

import { mutate } from 'swr';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useVinesTeam } from '@/components/router/guard/team.tsx';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form.tsx';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea.tsx';
import { VinesIconEditor } from '@/components/ui/vines-icon/editor.tsx';
import { DEFAULT_WORKFLOW_ICON_URL } from '@/consts/icons.ts';
import { useWorkflow } from '@/package/vines-flow';
import { createWorkflowSchema, ICreateWorkflowInfo } from '@/schema/workspace/create-workflow.ts';

export const WorkflowCreateForm: React.FC<{
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}> = ({ setOpen }) => {
  const { t } = useTranslation();

  const { createWorkflow } = useWorkflow();

  const form = useForm<ICreateWorkflowInfo>({
    resolver: zodResolver(createWorkflowSchema),
    defaultValues: {
      displayName: t('common.utils.untitled') + t('common.type.workflow'),
      description: '',
      iconUrl: DEFAULT_WORKFLOW_ICON_URL,
    },
  });

  const mutateWorkflows = () => mutate((key) => typeof key === 'string' && key.startsWith('/api/workflow/metadata'));

  const { teamId } = useVinesTeam();

  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = form.handleSubmit((data) => {
    if (!teamId) {
      toast.warning(t('common.toast.loading'));
      return;
    }
    setIsCreating(true);
    toast.promise(
      async (): Promise<string> => {
        const workflowId = await createWorkflow(data);
        if (!workflowId) throw new Error('workflow created failed');
        return workflowId;
      },
      {
        success: (workflowId) => {
          open(`/${teamId}/workspace/${workflowId}`, '_blank');
          setOpen(false);
          return t('common.create.success');
        },
        loading: t('common.create.loading'),
        error: t('common.create.error'),
        finally: () => {
          setIsCreating(false);
          void mutateWorkflows();
        },
      },
    );
  });

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="mt-2 flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <FormLabel>{t('ugc-page.app.create.dialog.info.label')}</FormLabel>

          <div className="flex w-full items-center gap-3">
            <FormField
              name="iconUrl"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <VinesIconEditor value={field.value} onChange={field.onChange} size="md" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="displayName"
              control={form.control}
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input
                      placeholder={t('ugc-page.app.create.dialog.info.placeholder')}
                      {...field}
                      className=""
                      autoFocus
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <FormField
          name="description"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('ugc-page.app.create.dialog.description.label')}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t('ugc-page.app.create.dialog.description.placeholder')}
                  className="h-28 resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter>
          <Button
            variant="outline"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setOpen(false);
            }}
          >
            {t('common.utils.cancel')}
          </Button>
          <Button variant="solid" type="submit" loading={isCreating}>
            {t('common.utils.create')}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};
