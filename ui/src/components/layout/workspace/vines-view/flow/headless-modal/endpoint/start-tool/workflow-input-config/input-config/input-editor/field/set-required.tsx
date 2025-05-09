import React from 'react';

import { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form.tsx';
import { Switch } from '@/components/ui/switch';
import { IWorkflowInput } from '@/schema/workspace/workflow-input.ts';

interface IFieldSetRequiredProps extends React.ComponentPropsWithoutRef<'div'> {
  form: UseFormReturn<IWorkflowInput>;
}

export const FieldSetRequired: React.FC<IFieldSetRequiredProps> = ({ form }) => {
  const { t } = useTranslation();

  return (
    <FormField
      name="required"
      control={form.control}
      render={({ field }) => (
        <FormItem>
          <div className="-mb-2 flex items-center justify-between py-2">
            <FormLabel>
              {t('workspace.flow-view.endpoint.start-tool.input.config-form.type-options.set-required.label')}
            </FormLabel>
            <FormControl>
              <Switch size="small" checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
