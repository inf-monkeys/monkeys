import React, { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { createWorkflowObservability, useWorkflowObservability } from '@/apis/workflow/observability';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form.tsx';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useVinesFlow } from '@/package/vines-flow';
import {
  createWorkflowObservabilitySchema,
  ICreateWorkflowObservability,
} from '@/schema/workspace/create-workflow-observability';

import { CreateModalPlatformLangfuseForm } from './langfuse';

interface ICreateModalProps {
  children?: React.ReactNode;
}

export const CreateModal: React.FC<ICreateModalProps> = ({ children }) => {
  const { t } = useTranslation();

  const { vines } = useVinesFlow();

  const { mutate } = useWorkflowObservability(vines.workflowId);

  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ICreateWorkflowObservability>({
    resolver: zodResolver(createWorkflowObservabilitySchema),
    defaultValues: {},
  });

  const handleSubmit = form.handleSubmit((data) => {
    if (!vines.workflowId) {
      return;
    }
    setIsLoading(true);
    toast.promise(createWorkflowObservability(vines.workflowId, data), {
      loading: t('common.create.loading'),
      success: () => {
        setOpen(false);
        void mutate();
        return t('common.create.success');
      },
      error: t('common.create.error'),
      finally: () => setIsLoading(false),
    });
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('workspace.logs-view.observability.workflow-create-modal.create-label')}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <FormField
              name="name"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('workspace.logs-view.observability.workflow-create-modal.table.columns.name.label')}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t(
                        'workspace.logs-view.observability.workflow-create-modal.table.columns.name.placeholder',
                      )}
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
              name="platform"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('workspace.logs-view.observability.workflow-create-modal.table.columns.platform.label')}
                  </FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t(
                              'workspace.logs-view.observability.workflow-create-modal.table.columns.platform.placeholder',
                            )}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={'langfuse'}>
                          {t(
                            'workspace.logs-view.observability.workflow-create-modal.table.columns.platform.options.langfuse',
                          )}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch('platform') === 'langfuse' && <CreateModalPlatformLangfuseForm form={form} />}

            <DialogFooter>
              <Button type="submit" loading={isLoading} variant="solid" size="small">
                {t('common.utils.confirm')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
