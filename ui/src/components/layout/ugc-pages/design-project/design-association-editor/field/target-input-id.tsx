import React from 'react';

import { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form.tsx';
import { Input } from '@/components/ui/input';
import { IDesignAssociationForEditor } from '@/schema/workspace/design-association';

interface IFieldTargetInputIdProps extends React.ComponentPropsWithoutRef<'div'> {
  form: UseFormReturn<IDesignAssociationForEditor>;
}

export const FieldTargetInputId: React.FC<IFieldTargetInputIdProps> = ({ form }) => {
  const { t } = useTranslation();
  return (
    <FormField
      name="targetInputId"
      control={form.control}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t('ugc-page.design-project.association-editor.editor.field.target-input-id.label')}</FormLabel>
          <FormControl>
            <div className="relative">
              <Input
                placeholder={t('ugc-page.design-project.association-editor.editor.field.target-input-id.placeholder')}
                value={field.value}
                onChange={(value) => field.onChange(value)}
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
