import React from 'react';

import { toNumber } from 'lodash';
import { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { FieldGroup, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form.tsx';
import { NumberField, NumberFieldInput } from '@/components/ui/input/number.tsx';
import { IWorkflowInput } from '@/schema/workspace/workflow-input.ts';

interface IFieldTextareaMinHeightProps extends React.ComponentPropsWithoutRef<'div'> {
  form: UseFormReturn<IWorkflowInput>;
}

export const FieldTextareaMinHeight: React.FC<IFieldTextareaMinHeightProps> = ({ form }) => {
  const { t } = useTranslation();

  return (
    <FormField
      name="textareaMiniHeight"
      control={form.control}
      render={({ field: { value, onChange, ...field } }) => (
        <FormItem>
          <FormLabel>
            {t('workspace.flow-view.endpoint.start-tool.input.config-form.type-options.textarea-mini-height.label')}
            <span className="ml-2 text-xxs text-muted-foreground">范围 40-300，默认 180</span>
          </FormLabel>
          <div className="px-1">
            <FormControl>
              <NumberField
                value={toNumber(value)}
                onChange={(v) => onChange(Math.max(40, Math.min(300, toNumber(v))))}
                minValue={40}
                maxValue={300}
                aria-label="textarea-min-height"
                {...field}
              >
                <FieldGroup>
                  <NumberFieldInput />
                </FieldGroup>
              </NumberField>
            </FormControl>
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
