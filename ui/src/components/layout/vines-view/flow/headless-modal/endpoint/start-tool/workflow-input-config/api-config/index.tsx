import React, { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { MonkeyWorkflow } from '@inf-monkeys/vines';
import { Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { updateWorkflow } from '@/apis/workflow';
import { IVinesWorkflowRateLimiter } from '@/apis/workflow/typings.ts';
import { useVinesPage } from '@/components/layout-wrapper/workspace/utils';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { Switch } from '@/components/ui/switch';
import { useVinesFlow } from '@/package/vines-flow';
import { IWorkflowApiConfigInfo, workflowApiConfigInfoSchema } from '@/schema/workspace/workflow-api-config';
import { useFlowStore } from '@/store/useFlowStore';
import { cn } from '@/utils';

interface IWorkflowApiConfigProps {}

export const WorkflowApiConfig: React.FC<IWorkflowApiConfigProps> = () => {
  const { t } = useTranslation();

  const { isLatestWorkflowVersion, workflowId } = useFlowStore();
  const { vines } = useVinesFlow();
  const { workflow } = useVinesPage();

  const rateLimiter: IVinesWorkflowRateLimiter | undefined = workflow?.rateLimiter;
  const exposeOpenaiCompatibleInterface = workflow?.exposeOpenaiCompatibleInterface;
  const [isLoading, setIsLoading] = useState(false);

  const workflowVersion = vines.version;

  const form = useForm<IWorkflowApiConfigInfo>({
    resolver: zodResolver(workflowApiConfigInfoSchema),
    defaultValues: {
      rateLimiter: {
        enabled: rateLimiter?.enabled ?? false,
        max: rateLimiter?.max ?? 10,
        windowMs: rateLimiter?.windowMs ?? 1000,
      },
      exposeOpenaiCompatibleInterface,
      openaiModelName: workflow?.openaiModelName,
    },
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    setIsLoading(true);
    if (!workflow?.workflowId) {
      setIsLoading(false);
      toast.error(t('workspace.flow-view.endpoint.start-tool.api-config.form.submit.workflow-id-empty'));
      return;
    }

    vines.enableOpenAIInterface = data.exposeOpenaiCompatibleInterface;

    toast.promise(
      updateWorkflow(workflowId, workflowVersion, {
        version: workflowVersion,
        ...data,
      } as Partial<MonkeyWorkflow>),
      {
        success: t('workspace.flow-view.endpoint.start-tool.api-config.form.submit.loading'),
        loading: t('workspace.flow-view.endpoint.start-tool.api-config.form.submit.success'),
        error: t('workspace.flow-view.endpoint.start-tool.api-config.form.submit.error'),
        finally: () => setIsLoading(false),
      },
    );
  });

  return (
    <div className="relative flex h-80 w-full flex-col py-2">
      <Form {...form}>
        <form onSubmit={handleSubmit} className="flex flex-col justify-between gap-4">
          <ScrollArea className="h-64">
            <FormField
              name="exposeOpenaiCompatibleInterface"
              control={form.control}
              render={({ field }) => (
                <FormItem className="flex flex-col gap-2">
                  <FormLabel>
                    {t(
                      'workspace.flow-view.endpoint.start-tool.api-config.form.expose-openai-compatible-interface.label',
                    )}
                  </FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.getValues().exposeOpenaiCompatibleInterface && (
              <FormField
                name="openaiModelName"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t('workspace.flow-view.endpoint.start-tool.api-config.form.openai-model-name.label')}
                    </FormLabel>
                    <FormDescription>
                      {t('workspace.flow-view.endpoint.start-tool.api-config.form.openai-model-name.desc')}
                    </FormDescription>
                    <FormControl>
                      <Input
                        placeholder={t(
                          'workspace.flow-view.endpoint.start-tool.api-config.form.openai-model-name.placeholder',
                        )}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              name="rateLimiter.enabled"
              control={form.control}
              render={({ field }) => (
                <FormItem className="flex flex-col gap-2">
                  <FormLabel>
                    {t('workspace.flow-view.endpoint.start-tool.api-config.form.rate-limiter.label')}
                  </FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.getValues().rateLimiter?.enabled && (
              <>
                <FormField
                  name="rateLimiter.windowMs"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t('workspace.flow-view.endpoint.start-tool.api-config.form.rate-limiter.window-ms.label')}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t(
                            'workspace.flow-view.endpoint.start-tool.api-config.form.rate-limiter.window-ms.placeholder',
                          )}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  name="rateLimiter.max"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t('workspace.flow-view.endpoint.start-tool.api-config.form.rate-limiter.max.label')}
                      </FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
          </ScrollArea>

          <Button
            loading={isLoading}
            className={cn(!isLatestWorkflowVersion && 'hidden')}
            variant="outline"
            icon={<Save />}
            type="submit"
          >
            {t('workspace.flow-view.endpoint.start-tool.api-config.form.submit.button')}
          </Button>
        </form>
      </Form>
    </div>
  );
};
