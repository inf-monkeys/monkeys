import React from 'react';

import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar.tsx';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form.tsx';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { IVinesSearchWorkflowExecutionStatParams } from '@/schema/workspace/workflow-execution-stat.ts';
import { cn } from '@/utils';

interface IVinesLogViewStatFilterProps {
  form: UseFormReturn<IVinesSearchWorkflowExecutionStatParams>;
  handleSubmit: () => void;
  isMutating: boolean;
}

export const VinesLogViewStatFilter: React.FC<IVinesLogViewStatFilterProps> = ({ form, handleSubmit, isMutating }) => {
  const { t } = useTranslation();

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
            name="startTimestamp"
            render={({ field }) => {
              const endTimestamp = form.getValues('endTimestamp');
              return (
                <FormItem>
                  <FormLabel>{t('workspace.logs-view.stat.filter.form.time.label')}</FormLabel>
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
                            endTimestamp ? (
                              format(field.value, 'yyyy-MM-dd') + '—' + format(endTimestamp, 'yyyy-MM-dd')
                            ) : (
                              format(field.value, 'yyyy-MM-dd')
                            )
                          ) : (
                            <span>{t('workspace.logs-view.stat.filter.form.time.placeholder')}</span>
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
                            to: endTimestamp ? new Date(endTimestamp) : undefined,
                          }}
                          onSelect={(selectedDate) => {
                            selectedDate?.from && field.onChange(selectedDate.from.getTime());
                            selectedDate?.to && form.setValue('endTimestamp', selectedDate.to.getTime());
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
          <div className="mt-2 flex w-full gap-2">
            <Button type="reset" theme="tertiary" className="flex-1" disabled={isMutating}>
              {t('workspace.logs-view.stat.filter.form.reset')}
            </Button>
            <Button type="submit" variant="solid" className="flex-1" disabled={isMutating}>
              {t('workspace.logs-view.stat.filter.form.submit')}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};
