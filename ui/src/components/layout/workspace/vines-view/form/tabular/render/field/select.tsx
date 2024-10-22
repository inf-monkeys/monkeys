import React from 'react';

import { ControllerRenderProps, FieldValues, UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.tsx';
import { VinesWorkflowVariable } from '@/package/vines-flow/core/tools/typings.ts';
import { IWorkflowInputSelectListLinkage } from '@/schema/workspace/workflow-input.ts';
import { IWorkflowInputForm } from '@/schema/workspace/workflow-input-form.ts';

interface IFieldSelectProps extends React.ComponentPropsWithoutRef<'div'> {
  input: VinesWorkflowVariable;
  value: any;
  onChange: (value: any) => void;

  form: UseFormReturn<IWorkflowInputForm>;
  field: Omit<ControllerRenderProps<FieldValues, string>, 'value' | 'onChange'>;
}

export const FieldSelect: React.FC<IFieldSelectProps> = ({
  input: { type, displayName, typeOptions },
  form,
  value,
  onChange,
}) => {
  const { t } = useTranslation();

  const selectList = (typeOptions?.selectList ?? []) as {
    value: string;
    label: string;
    linkage?: IWorkflowInputSelectListLinkage;
  }[];

  return (
    <Select
      onValueChange={(val) => {
        onChange(type === 'number' ? Number(val) : val);
        const linkage = selectList.find((it) => it.value === val)?.linkage;
        if (linkage) {
          for (const { name, value } of linkage) {
            form.setValue(name, value);
          }
        }
      }}
      value={value?.toString() ?? ''}
    >
      <SelectTrigger>
        <SelectValue placeholder={t('workspace.pre-view.actuator.execution-form.select', { displayName })} />
      </SelectTrigger>
      <SelectContent>
        {selectList.map((it, i) => (
          <SelectItem value={it.value?.toString()} key={i}>
            {it.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
