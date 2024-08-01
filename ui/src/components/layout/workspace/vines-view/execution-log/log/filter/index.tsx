import React from 'react';

import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useWorkflowVersions } from '@/apis/workflow/version';
import {
  EXECUTION_STATUS_LIST,
  TRIGGER_TYPE_LIST,
} from '@/components/layout/workspace/vines-view/execution-log/log/filter/consts.ts';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar.tsx';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form.tsx';
import { Input } from '@/components/ui/input';
import MultipleSelector from '@/components/ui/multiple-selector';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { useVinesFlow } from '@/package/vines-flow';
import { IVinesSearchWorkflowExecutionsParams } from '@/schema/workspace/workflow-execution.ts';
import { cn } from '@/utils';

interface IVinesLogViewLogFilterProps {
  form: UseFormReturn<IVinesSearchWorkflowExecutionsParams>;
  handleSubmit: (loadNextPage?: boolean) => void;
  isMutating: boolean;
}

export const VinesLogViewLogFilter: React.FC<IVinesLogViewLogFilterProps> = ({ form, handleSubmit, isMutating }) => {
  const { t } = useTranslation();

  const { vines } = useVinesFlow();
  const { data: workflowMultiVersionData } = useWorkflowVersions(vines.workflowId ?? '');

  const workflowVersions = (workflowMultiVersionData ?? []).map((flow) => flow.version);
  const workflowVersionOptions = workflowVersions.map((ver) => {
    return {
      label: ver === -1 ? t('workspace.logs-view.log.filter.form.versions.temp') : ver.toString(),
      value: ver.toString(),
    };
  });
  const workflowStatusOptions = EXECUTION_STATUS_LIST.map((status) => {
    return {
      label: t(`common.workflow.status.${status}`),
      value: status!,
    };
  });
  const workflowTriggerTypeOptions = TRIGGER_TYPE_LIST.map((trigger) => {
    return {
      label: t(`common.workflow.trigger.${trigger}`),
      value: trigger,
    };
  });

  return (
    <div className="flex flex-col gap-4 px-2">
      <Form {...form}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          onReset={() => {
            form.reset();
            handleSubmit();
          }}
          className="flex flex-col"
        >
          <FormField
            control={form.control}
            name="versions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('workspace.logs-view.log.filter.form.versions.label')}</FormLabel>
                <FormControl>
                  <MultipleSelector
                    value={(field.value ?? []).map((ver) => {
                      return {
                        label: ver === -1 ? t('workspace.logs-view.log.filter.form.versions.temp') : ver.toString(),
                        value: ver.toString(),
                      };
                    })}
                    onChange={(options) => {
                      field.onChange(options.map((option) => parseInt(option.value)));
                    }}
                    defaultOptions={workflowVersionOptions}
                    placeholder={t('workspace.logs-view.log.filter.form.versions.placeholder')}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="startTimeFrom"
            render={({ field }) => {
              const endTimeTo = form.getValues('endTimeTo');
              return (
                <FormItem>
                  <FormLabel>{t('workspace.logs-view.log.filter.form.start-time.label')}</FormLabel>
                  <FormControl>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="date"
                          variant="outline"
                          className={cn(
                            'w-full justify-start text-left font-normal',
                            !field.value && 'text-muted-foreground',
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? (
                            endTimeTo ? (
                              format(field.value, 'yyyy-MM-dd') + '—' + format(endTimeTo, 'yyyy-MM-dd')
                            ) : (
                              format(field.value, 'yyyy-MM-dd')
                            )
                          ) : (
                            <span>{t('workspace.logs-view.log.filter.form.start-time.placeholder')}</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          initialFocus
                          mode="range"
                          defaultMonth={field.value ? new Date(field.value) : undefined}
                          selected={{
                            from: field.value ? new Date(field.value) : undefined,
                            to: endTimeTo ? new Date(endTimeTo) : undefined,
                          }}
                          onSelect={(selectedDate) => {
                            selectedDate?.from && field.onChange(selectedDate.from.getTime());
                            selectedDate?.to && form.setValue('endTimeTo', selectedDate.to.getTime());
                          }}
                          numberOfMonths={2}
                        />
                      </PopoverContent>
                    </Popover>
                  </FormControl>

                  <FormMessage />
                </FormItem>
              );
            }}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('workspace.logs-view.log.filter.form.status.label')}</FormLabel>
                <FormControl>
                  <MultipleSelector
                    value={(field.value ?? []).map((status) => {
                      return {
                        label: t(`common.workflow.status.${status}`),
                        value: status,
                      };
                    })}
                    onChange={(options) => {
                      field.onChange(options.map((option) => option.value));
                    }}
                    defaultOptions={workflowStatusOptions}
                    placeholder={t('workspace.logs-view.log.filter.form.status.placeholder')}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="triggerTypes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('workspace.logs-view.log.filter.form.trigger-types.label')}</FormLabel>
                <FormControl>
                  <MultipleSelector
                    value={(field.value ?? []).map((value) => {
                      return {
                        label: t(`common.workflow.trigger.${value}`),
                        value,
                      };
                    })}
                    onChange={(options) => {
                      field.onChange(options.map((option) => option.value));
                    }}
                    defaultOptions={workflowTriggerTypeOptions}
                    placeholder={t('workspace.logs-view.log.filter.form.trigger-types.placeholder')}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="workflowInstanceId"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('workspace.logs-view.log.filter.form.workflow-instance-id.label')}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t('workspace.logs-view.log.filter.form.workflow-instance-id.placeholder')}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="orderBy.order"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between py-3">
                  <FormLabel>{t('workspace.logs-view.log.filter.form.order-by.label')}</FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value === 'ASC'}
                      onCheckedChange={(asc) => {
                        field.onChange(asc ? 'ASC' : 'DESC');
                      }}
                    />
                  </FormControl>
                </div>
              </FormItem>
            )}
          />

          <div className="mt-2 flex w-full gap-2">
            <Button type="reset" theme="tertiary" className="flex-1" disabled={isMutating}>
              {t('workspace.logs-view.log.filter.form.reset')}
            </Button>
            <Button type="submit" variant="solid" className="flex-1" disabled={isMutating}>
              {t('workspace.logs-view.log.filter.form.submit')}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};
