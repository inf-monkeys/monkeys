import React from 'react';

import { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form.tsx';
import { Switch } from '@/components/ui/switch';
import { IWorkflowAssociationForEditor } from '@/schema/workspace/workflow-association';

interface IFieldEnabledProps extends React.ComponentPropsWithoutRef<'div'> {
  form: UseFormReturn<IWorkflowAssociationForEditor>;
}

export const FieldEnabled: React.FC<IFieldEnabledProps> = ({ form }) => {
  const { t } = useTranslation();

  return (
    <FormField
      name="enabled"
      control={form.control}
      render={({ field }) => (
        <FormItem className="mb-2 flex flex-row items-center justify-between gap-2 rounded-lg border p-4">
          <div className="space-y-0.5">
            <FormLabel className="text-base">
              {t('workspace.flow-view.tooltip.more.association-editor.editor.field.enabled.label')}
            </FormLabel>
            <div className="text-sm text-muted-foreground">
              {t('workspace.flow-view.tooltip.more.association-editor.editor.field.enabled.description')}
            </div>
          </div>
          <FormControl>
            <Switch checked={field.value} onCheckedChange={field.onChange} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
