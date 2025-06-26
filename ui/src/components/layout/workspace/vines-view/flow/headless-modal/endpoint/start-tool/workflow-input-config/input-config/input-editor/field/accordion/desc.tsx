import React from 'react';

import { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form.tsx';
import { I18nTextarea } from '@/components/ui/i18n-textarea';
import { IWorkflowInput } from '@/schema/workspace/workflow-input.ts';

interface IFieldDescProps extends React.ComponentPropsWithoutRef<'div'> {
  form: UseFormReturn<IWorkflowInput>;
}

export const FieldDesc: React.FC<IFieldDescProps> = ({ form }) => {
  const { t } = useTranslation();

  return (
    <FormField
      name="description"
      control={form.control}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t('workspace.flow-view.endpoint.start-tool.input.config-form.desc.label')}</FormLabel>
          <div className="px-1">
            <FormControl>
              <I18nTextarea
                placeholder={t('workspace.flow-view.endpoint.start-tool.input.config-form.desc.placeholder')}
                value={field.value}
                onChange={field.onChange}
                className="grow"
                dialogTitle={t('workspace.flow-view.endpoint.start-tool.input.config-form.desc.edit-label')}
              />
            </FormControl>
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
