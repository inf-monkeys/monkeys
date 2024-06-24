import React, { useEffect, useState } from 'react';

import { useSWRConfig } from 'swr';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForceUpdate } from '@mantine/hooks';
import { isUndefined, omitBy } from 'lodash';
import { Check, ChevronsUpDown } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useTriggerCreate } from '@/apis/workflow/trigger';
import { IVinesWebhookTriggerConfig, WorkflowTriggerType } from '@/apis/workflow/trigger/typings.ts';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form.tsx';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useVinesFlow } from '@/package/vines-flow';
import {
  AuthTypeLabelEnum,
  EAuthTypeEnum,
  EMethodEnum,
  EResponseUntilEnum,
  IWorkflowTriggerWebhook,
  ResponseUntilLabelEnum,
  workflowTriggerWebhookSchema,
} from '@/schema/workspace/workflow-trigger-webhook.ts';
import { useFlowStore } from '@/store/useFlowStore';
import { cn } from '@/utils';
import VinesEvent from '@/utils/events.ts';

interface IWebhookTriggerProps extends React.ComponentPropsWithoutRef<'div'> {}

export const WebhookTrigger: React.FC<IWebhookTriggerProps> = () => {
  const { t } = useTranslation();

  const { mutate } = useSWRConfig();
  const { workflowId } = useFlowStore();

  const { vines } = useVinesFlow();
  const workflowVersion = vines.version;

  const { trigger } = useTriggerCreate(workflowId);

  const [open, setOpen] = useState(false);

  const forceUpdate = useForceUpdate();

  const form = useForm<IWorkflowTriggerWebhook>({
    resolver: zodResolver(workflowTriggerWebhookSchema),
  });

  useEffect(() => {
    const handleOpen = (_wid: string) => {
      if (workflowId !== _wid) return;
      setOpen(true);
    };
    VinesEvent.on('flow-trigger-webhook', handleOpen);
    return () => {
      VinesEvent.off('flow-trigger-webhook', handleOpen);
    };
  }, []);

  const handleSubmit = form.handleSubmit((data) => {
    const payload = omitBy(data, isUndefined);
    toast.promise(
      trigger({
        triggerType: WorkflowTriggerType.WEBHOOK,
        enabled: false,
        version: workflowVersion,
        webhookConfig: payload as IVinesWebhookTriggerConfig,
      }),
      {
        loading: t('workspace.flow-view.endpoint.start-tool.trigger.create.webhook-trigger.loading'),
        success: () => {
          void mutate(`/api/workflow/${workflowId}/triggers?version=${workflowVersion}`);
          return t('workspace.flow-view.endpoint.start-tool.trigger.create.webhook-trigger.success');
        },
        error: t('workspace.flow-view.endpoint.start-tool.trigger.create.webhook-trigger.error'),
      },
    );
    setOpen(false);
  });

  const MethodOptions = Object.keys(EMethodEnum);
  const AuthOptions = Object.keys(EAuthTypeEnum);
  const ResponseUntilOptions = Object.keys(EResponseUntilEnum);

  const { auth } = form.getValues();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogTitle>{t('workspace.flow-view.endpoint.start-tool.trigger.create.webhook-trigger.title')}</DialogTitle>
        <DialogDescription>
          {t('workspace.flow-view.endpoint.start-tool.trigger.create.webhook-trigger.desc')}
        </DialogDescription>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <FormField
              name="method"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('workspace.flow-view.endpoint.start-tool.trigger.create.webhook-trigger.form.method.label')}
                  </FormLabel>
                  <FormControl>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn('w-full justify-between', !field.value && 'text-muted-foreground')}
                          >
                            {field.value
                              ? field.value
                              : t(
                                  'workspace.flow-view.endpoint.start-tool.trigger.create.webhook-trigger.form.method.placeholder',
                                )}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="p-0">
                        <Command>
                          <CommandInput
                            placeholder={t(
                              'workspace.flow-view.endpoint.start-tool.trigger.create.webhook-trigger.form.method.search',
                            )}
                          />
                          <CommandEmpty>
                            {t(
                              'workspace.flow-view.endpoint.start-tool.trigger.create.webhook-trigger.form.method.search-empty',
                            )}
                          </CommandEmpty>
                          <CommandGroup>
                            {MethodOptions.map((it, i) => (
                              <CommandItem
                                value={it}
                                key={i}
                                onSelect={() => form.setValue('method', it as keyof typeof EMethodEnum)}
                              >
                                <Check
                                  className={cn('mr-2 h-4 w-4', it === field.value ? 'opacity-100' : 'opacity-0')}
                                />
                                {it}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name="auth"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('workspace.flow-view.endpoint.start-tool.trigger.create.webhook-trigger.form.auth.label')}
                  </FormLabel>
                  <FormControl>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn('w-full justify-between', !field.value && 'text-muted-foreground')}
                          >
                            {field.value
                              ? t(AuthTypeLabelEnum[field.value])
                              : t(
                                  'workspace.flow-view.endpoint.start-tool.trigger.create.webhook-trigger.form.auth.label',
                                )}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="p-0">
                        <Command>
                          <CommandInput
                            placeholder={t(
                              'workspace.flow-view.endpoint.start-tool.trigger.create.webhook-trigger.form.auth.label',
                            )}
                          />
                          <CommandEmpty>
                            {t(
                              'workspace.flow-view.endpoint.start-tool.trigger.create.webhook-trigger.form.auth.label',
                            )}
                          </CommandEmpty>
                          <CommandGroup>
                            {AuthOptions.map((it, i) => (
                              <CommandItem
                                value={it}
                                key={i}
                                onSelect={() => {
                                  form.setValue('auth', it as keyof typeof EAuthTypeEnum);
                                  if (it === 'NONE' || it === 'BASIC') {
                                    form.setValue('headerAuthConfig', void 0);
                                  }
                                  if (it === 'NONE' || it === 'CUSTOM_HEADER') {
                                    form.setValue('basicAuthConfig', void 0);
                                  }
                                  forceUpdate();
                                }}
                              >
                                <Check
                                  className={cn('mr-2 h-4 w-4', it === field.value ? 'opacity-100' : 'opacity-0')}
                                />
                                {t(AuthTypeLabelEnum[it])}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {auth === 'BASIC' && (
              <>
                <FormField
                  name="basicAuthConfig.username"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t(
                          'workspace.flow-view.endpoint.start-tool.trigger.create.webhook-trigger.form.username.label',
                        )}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t(
                            'workspace.flow-view.endpoint.start-tool.trigger.create.webhook-trigger.form.username.placeholder',
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
                  name="basicAuthConfig.password"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t(
                          'workspace.flow-view.endpoint.start-tool.trigger.create.webhook-trigger.form.password.label',
                        )}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t(
                            'workspace.flow-view.endpoint.start-tool.trigger.create.webhook-trigger.form.password.placeholder',
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
              </>
            )}

            {auth === 'CUSTOM_HEADER' && (
              <>
                <FormField
                  name="headerAuthConfig.headerKey"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t(
                          'workspace.flow-view.endpoint.start-tool.trigger.create.webhook-trigger.form.header-key.label',
                        )}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t(
                            'workspace.flow-view.endpoint.start-tool.trigger.create.webhook-trigger.form.header-key.placeholder',
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
                  name="headerAuthConfig.headerValue"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t(
                          'workspace.flow-view.endpoint.start-tool.trigger.create.webhook-trigger.form.header-value.label',
                        )}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t(
                            'workspace.flow-view.endpoint.start-tool.trigger.create.webhook-trigger.form.header-value.placeholder',
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
              </>
            )}

            <FormField
              name="responseUntil"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t(
                      'workspace.flow-view.endpoint.start-tool.trigger.create.webhook-trigger.form.response-until.label',
                    )}
                  </FormLabel>
                  <FormControl>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn('w-full justify-between', !field.value && 'text-muted-foreground')}
                          >
                            {field.value
                              ? t(ResponseUntilLabelEnum[field.value])
                              : t(
                                  'workspace.flow-view.endpoint.start-tool.trigger.create.webhook-trigger.form.response-until.placeholder',
                                )}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="p-0">
                        <Command>
                          <CommandInput
                            placeholder={t(
                              'workspace.flow-view.endpoint.start-tool.trigger.create.webhook-trigger.form.response-until.search',
                            )}
                          />
                          <CommandEmpty>
                            {t(
                              'workspace.flow-view.endpoint.start-tool.trigger.create.webhook-trigger.form.response-until.search-empty',
                            )}
                          </CommandEmpty>
                          <CommandGroup>
                            {ResponseUntilOptions.map((it, i) => (
                              <CommandItem
                                value={it}
                                key={i}
                                onSelect={() => form.setValue('responseUntil', it as keyof typeof EResponseUntilEnum)}
                              >
                                <Check
                                  className={cn('mr-2 h-4 w-4', it === field.value ? 'opacity-100' : 'opacity-0')}
                                />
                                {t(ResponseUntilLabelEnum[it])}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button variant="outline" type="submit">
                {t('workspace.flow-view.endpoint.start-tool.trigger.create.webhook-trigger.form.submit')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
