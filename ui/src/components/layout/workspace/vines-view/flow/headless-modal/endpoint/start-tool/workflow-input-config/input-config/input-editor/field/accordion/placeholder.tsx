import React from 'react';

import { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form.tsx';
import { Textarea } from '@/components/ui/textarea.tsx';
import { IWorkflowInput } from '@/schema/workspace/workflow-input.ts';

interface IFieldPlaceholderProps extends React.ComponentPropsWithoutRef<'div'> {
  form: UseFormReturn<IWorkflowInput>;
}

export const FieldPlaceholder: React.FC<IFieldPlaceholderProps> = ({ form }) => {
  const { t } = useTranslation();

  return (
    <FormField
      name="placeholder"
      control={form.control}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t('workspace.flow-view.endpoint.start-tool.input.config-form.placeholder.label')}</FormLabel>
          <div className="px-1">
            <FormControl>
              <Textarea
                placeholder={t('workspace.flow-view.endpoint.start-tool.input.config-form.placeholder.placeholder')}
                {...field}
                className="grow"
              />
            </FormControl>
          </div>
          <FormDescription>
            {t('workspace.flow-view.endpoint.start-tool.input.config-form.placeholder.placeholder')}
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
