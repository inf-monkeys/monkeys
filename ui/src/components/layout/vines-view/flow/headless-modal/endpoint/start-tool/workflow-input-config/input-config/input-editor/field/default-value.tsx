import React from 'react';

import { isArray, isBoolean } from 'lodash';
import { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { BOOLEAN_VALUES } from '@/components/layout/vines-view/execution/workflow-input';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form.tsx';
import { TagInput } from '@/components/ui/input/tag';
import { SmoothTransition } from '@/components/ui/smooth-transition-size/SmoothTransition.tsx';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea.tsx';
import { IWorkflowInput } from '@/schema/workspace/workflow-input.ts';

interface IFieldDefaultValueProps extends React.ComponentPropsWithoutRef<'div'> {
  form: UseFormReturn<IWorkflowInput>;
}

export const FieldDefaultValue: React.FC<IFieldDefaultValueProps> = ({ form }) => {
  const { t } = useTranslation();

  const { multipleValues, type } = form.getValues();

  return (
    <FormField
      name="default"
      control={form.control}
      render={({ field: { value, ...field } }) => (
        <FormItem>
          <FormLabel>{t('workspace.flow-view.endpoint.start-tool.input.config-form.default.label')}</FormLabel>
          <FormControl>
            <SmoothTransition>
              {multipleValues ? (
                <TagInput
                  placeholder={t('workspace.flow-view.endpoint.start-tool.input.config-form.default.placeholder-list')}
                  value={isArray(value) ? value.map((it: string | number | boolean) => it.toString()) : []}
                  onChange={(value) => form.setValue('default', value)}
                />
              ) : type === 'boolean' ? (
                <Switch
                  checked={isBoolean(value) ? value : BOOLEAN_VALUES.includes((value as string)?.toString())}
                  onCheckedChange={field.onChange}
                />
              ) : (
                <Textarea
                  placeholder={t('workspace.flow-view.endpoint.start-tool.input.config-form.default.placeholder')}
                  className="resize-none"
                  value={value?.toString()}
                  {...field}
                />
              )}
            </SmoothTransition>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
