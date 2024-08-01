import React from 'react';

import { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form.tsx';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator.tsx';
import { IWorkflowInput } from '@/schema/workspace/workflow-input.ts';

interface IFieldNumberProps extends React.ComponentPropsWithoutRef<'div'> {
  form: UseFormReturn<IWorkflowInput>;
}

export const FieldNumber: React.FC<IFieldNumberProps> = ({ form }) => {
  const { t } = useTranslation();

  return (
    <>
      <Separator orientation="vertical" className="mx-2" />
      <div className="flex w-72 flex-col gap-2">
        <FormField
          name="minValue"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t('workspace.flow-view.endpoint.start-tool.input.config-form.type-options.min-value.label')}
              </FormLabel>
              <FormControl>
                <Input
                  placeholder={t(
                    'workspace.flow-view.endpoint.start-tool.input.config-form.type-options.min-value.placeholder',
                  )}
                  {...field}
                  className="grow"
                  autoFocus
                  type="number"
                  onChange={(value) => form.setValue('minValue', Number(value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="maxValue"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t('workspace.flow-view.endpoint.start-tool.input.config-form.type-options.max-value.label')}
              </FormLabel>
              <FormControl>
                <Input
                  placeholder={t(
                    'workspace.flow-view.endpoint.start-tool.input.config-form.type-options.max-value.placeholder',
                  )}
                  {...field}
                  className="grow"
                  autoFocus
                  type="number"
                  onChange={(value) => form.setValue('maxValue', Number(value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="numberPrecision"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t('workspace.flow-view.endpoint.start-tool.input.config-form.type-options.number-precision.label')}
              </FormLabel>
              <FormControl>
                <Input
                  placeholder={t(
                    'workspace.flow-view.endpoint.start-tool.input.config-form.type-options.number-precision.placeholder',
                  )}
                  {...field}
                  className="grow"
                  autoFocus
                  type="number"
                  onChange={(value) => form.setValue('numberPrecision', Number(value))}
                />
              </FormControl>
              <FormDescription>
                {t(
                  'workspace.flow-view.endpoint.start-tool.input.config-form.type-options.number-precision.description',
                )}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </>
  );
};
