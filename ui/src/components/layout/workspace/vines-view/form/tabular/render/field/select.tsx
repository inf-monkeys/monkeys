import React, { useEffect, useRef } from 'react';

import { ControllerRenderProps, FieldValues, UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { MultiSelect } from '@/components/ui/multi-select';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.tsx';
import { VinesWorkflowVariable } from '@/package/vines-flow/core/tools/typings.ts';
import { IWorkflowInputSelectListLinkage } from '@/schema/workspace/workflow-input.ts';
import { IWorkflowInputForm } from '@/schema/workspace/workflow-input-form.ts';

export type TSelect = {
  value: string;
  label: string;
  linkage?: IWorkflowInputSelectListLinkage;
};
export type TSelectList = TSelect[];

interface IFieldSelectProps extends React.ComponentPropsWithoutRef<'div'> {
  input: VinesWorkflowVariable;
  value: any;
  onChange: (value: any) => void;

  form: UseFormReturn<IWorkflowInputForm>;
  field: Omit<ControllerRenderProps<FieldValues, string>, 'value' | 'onChange'>;

  filter?: (it: TSelect) => boolean;

  setLinkage?: (k: string, v: IWorkflowInputSelectListLinkage) => void;
}

export const FieldSelect: React.FC<IFieldSelectProps> = ({
  input: { type, name, displayName, typeOptions },
  form,
  value,
  onChange,
  filter,
  setLinkage,
}) => {
  const { t } = useTranslation();

  const selectList = (typeOptions?.selectList ?? []).filter(filter ?? (() => true)) as TSelectList;

  const handleLinkage = (val: string) => {
    if (!typeOptions?.multipleValues) {
      const linkage = selectList.find((it) => it.value === val)?.linkage;
      if (linkage?.length) {
        for (const { name, value } of linkage) {
          form.setValue(name, value);
        }
        setLinkage?.(name, linkage);
      } else {
        setLinkage?.(name, []);
      }
    }
  };

  const finalValue = typeOptions?.multipleValues ? value || [] : value?.toString() ?? '';

  const initialRef = useRef(false);
  useEffect(() => {
    if (initialRef.current) return;
    if (finalValue) {
      handleLinkage(finalValue);
      initialRef.current = true;
    }
  }, [finalValue]);

  return typeOptions?.multipleValues ? (
    <MultiSelect
      onValueChange={(val) => {
        onChange(type === 'number' ? val.map(Number) : val);
      }}
      value={finalValue || []}
      options={selectList}
      placeholder={t('workspace.pre-view.actuator.execution-form.select', { displayName })}
    />
  ) : (
    <Select
      onValueChange={(val) => {
        onChange(type === 'number' ? Number(val) : val);
        handleLinkage(val);
      }}
      value={finalValue}
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
