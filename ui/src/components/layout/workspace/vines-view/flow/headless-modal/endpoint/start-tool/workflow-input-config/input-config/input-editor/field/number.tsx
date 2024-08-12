import React from 'react';

import { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import {
  FieldGroup,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form.tsx';
import { NumberField, NumberFieldInput } from '@/components/ui/input/number.tsx';
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
                <NumberField {...field}>
                  <FieldGroup>
                    <NumberFieldInput
                      placeholder={t(
                        'workspace.flow-view.endpoint.start-tool.input.config-form.type-options.min-value.placeholder',
                      )}
                    />
                  </FieldGroup>
                </NumberField>
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
                <NumberField {...field}>
                  <FieldGroup>
                    <NumberFieldInput
                      placeholder={t(
                        'workspace.flow-view.endpoint.start-tool.input.config-form.type-options.max-value.placeholder',
                      )}
                    />
                  </FieldGroup>
                </NumberField>
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
                <NumberField {...field}>
                  <FieldGroup>
                    <NumberFieldInput
                      placeholder={t(
                        'workspace.flow-view.endpoint.start-tool.input.config-form.type-options.number-precision.placeholder',
                      )}
                    />
                  </FieldGroup>
                </NumberField>
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
