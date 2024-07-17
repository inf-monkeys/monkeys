import React from 'react';

import { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form.tsx';
import { Input } from '@/components/ui/input';
import { IWorkflowInput } from '@/schema/workspace/workflow-input.ts';

interface IFieldDisplayNameProps extends React.ComponentPropsWithoutRef<'div'> {
  form: UseFormReturn<IWorkflowInput>;
}

export const FieldDisplayName: React.FC<IFieldDisplayNameProps> = ({ form }) => {
  const { t } = useTranslation();

  return (
    <FormField
      name="displayName"
      control={form.control}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t('workspace.flow-view.endpoint.start-tool.input.config-form.display-name.label')}</FormLabel>
          <FormControl>
            <Input
              placeholder={t('workspace.flow-view.endpoint.start-tool.input.config-form.display-name.placeholder')}
              {...field}
              className="grow"
              autoFocus
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
