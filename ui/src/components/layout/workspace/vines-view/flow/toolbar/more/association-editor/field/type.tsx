import React from 'react';

import { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { IWorkflowAssociationType } from '@/apis/workflow/association/typings.ts';
import { FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form.tsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.tsx';
import { IWorkflowAssociationForEditor } from '@/schema/workspace/workflow-association.ts';

interface IFieldTypeProps extends React.ComponentPropsWithoutRef<'div'> {
  form: UseFormReturn<IWorkflowAssociationForEditor>;
}

const OPTIONS: IWorkflowAssociationType[] = ['to-workflow', 'new-design'];

export const FieldType: React.FC<IFieldTypeProps> = ({ form }) => {
  const { t } = useTranslation();

  return (
    <FormField
      name="type"
      control={form.control}
      render={({ field }) => {
        return (
          <FormItem>
            <FormLabel>{t('workspace.flow-view.tooltip.more.association-editor.editor.field.type.label')}</FormLabel>
            <Select
              onValueChange={(val: IWorkflowAssociationType) => {
                form.setValue('type', val);
              }}
              value={field.value}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={t('workspace.flow-view.tooltip.more.association-editor.editor.field.type.placeholder')}
                />
              </SelectTrigger>
              <SelectContent>
                {OPTIONS.map((it, i) => (
                  <SelectItem value={it} key={i}>
                    {t(`workspace.flow-view.tooltip.more.association-editor.editor.field.type.options.${it}.label`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
};
