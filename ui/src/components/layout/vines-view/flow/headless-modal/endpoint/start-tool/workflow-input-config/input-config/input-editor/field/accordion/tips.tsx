import React from 'react';

import { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form.tsx';
import { Textarea } from '@/components/ui/textarea.tsx';
import { IWorkflowInput } from '@/schema/workspace/workflow-input.ts';

interface IFieldTipsProps extends React.ComponentPropsWithoutRef<'div'> {
  form: UseFormReturn<IWorkflowInput>;
}

export const FieldTips: React.FC<IFieldTipsProps> = ({ form }) => {
  const { t } = useTranslation();

  return (
    <FormField
      name="tips"
      control={form.control}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t('workspace.flow-view.endpoint.start-tool.input.config-form.tips.label')}</FormLabel>
          <div className="px-1">
            <FormControl>
              <Textarea
                placeholder={t('workspace.flow-view.endpoint.start-tool.input.config-form.tips.placeholder')}
                {...field}
                className="grow"
              />
            </FormControl>
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
