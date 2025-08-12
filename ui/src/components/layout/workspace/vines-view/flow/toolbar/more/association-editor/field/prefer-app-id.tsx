import React from 'react';

import { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form.tsx';
import { Input } from '@/components/ui/input';
import { IWorkflowAssociationForEditor } from '@/schema/workspace/workflow-association';

interface IFieldPreferAppIdProps extends React.ComponentPropsWithoutRef<'div'> {
  form: UseFormReturn<IWorkflowAssociationForEditor>;
}

export const FieldPreferAppId: React.FC<IFieldPreferAppIdProps> = ({ form }) => {
  const { t } = useTranslation();

  return (
    <FormField
      name="preferAppId"
      control={form.control}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {t('workspace.flow-view.tooltip.more.association-editor.editor.field.prefer-app-id.label')}
          </FormLabel>
          <FormControl>
            <div className="relative">
              <Input
                placeholder={t(
                  'workspace.flow-view.tooltip.more.association-editor.editor.field.prefer-app-id.placeholder',
                )}
                value={field.value as string | undefined}
                onChange={field.onChange}
                className="grow pr-14"
                autoFocus
              />
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
