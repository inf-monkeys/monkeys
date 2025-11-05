import React, { useEffect, useRef } from 'react';

import { ControllerRenderProps, FieldValues, UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { MultiSelect } from '@/components/ui/multi-select';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.tsx';
import { VinesWorkflowVariable } from '@/package/vines-flow/core/tools/typings.ts';
import { IWorkflowInputSelectListLinkage } from '@/schema/workspace/workflow-input.ts';
import { IWorkflowInputForm } from '@/schema/workspace/workflow-input-form.ts';
import { cn, getI18nContent } from '@/utils';

export type TSelect = {
  value: string;
  label: string | Record<string, string>;
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
  const displayMode = typeOptions?.selectListDisplayMode || 'dropdown';

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

  // 按钮模式渲染
  if (displayMode === 'button') {
    return typeOptions?.multipleValues ? (
      <div className="flex flex-wrap gap-2">
        {selectList.map((it, i) => {
          const isSelected = (finalValue as any[]).includes(it.value);
          return (
            <Button
              key={i}
              type="button"
              variant={isSelected ? 'default' : 'outline'}
              size="small"
              onClick={() => {
                const newValue = isSelected
                  ? (finalValue as any[]).filter((v) => v !== it.value)
                  : [...(finalValue as any[]), it.value];
                onChange(type === 'number' ? newValue.map(Number) : newValue);
              }}
              className={cn('whitespace-nowrap', isSelected && 'bg-vines-500 text-white hover:bg-vines-600')}
            >
              {getI18nContent(it.label)}
            </Button>
          );
        })}
      </div>
    ) : (
      <div className="flex flex-wrap gap-2">
        {selectList.map((it, i) => {
          const isSelected = finalValue === it.value?.toString();
          return (
            <Button
              key={i}
              type="button"
              variant={isSelected ? 'default' : 'outline'}
              size="small"
              onClick={() => {
                onChange(type === 'number' ? Number(it.value) : it.value);
                handleLinkage(it.value?.toString());
              }}
              className={cn('whitespace-nowrap', isSelected && 'bg-vines-500 text-white hover:bg-vines-600')}
            >
              {getI18nContent(it.label)}
            </Button>
          );
        })}
      </div>
    );
  }

  // 下拉模式渲染（原有逻辑）
  return typeOptions?.multipleValues ? (
    <MultiSelect
      onValueChange={(val) => {
        onChange(type === 'number' ? val.map(Number) : val);
      }}
      value={finalValue || []}
      options={selectList.map((item) => ({ ...item, label: getI18nContent(item.label) || '' }))}
      placeholder={t('workspace.pre-view.actuator.execution-form.select', { displayName: getI18nContent(displayName) })}
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
        <SelectValue
          placeholder={t('workspace.pre-view.actuator.execution-form.select', {
            displayName: getI18nContent(displayName),
          })}
        />
      </SelectTrigger>
      <SelectContent>
        {selectList.map((it, i) => (
          <SelectItem value={it.value?.toString()} key={i}>
            {getI18nContent(it.label)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
