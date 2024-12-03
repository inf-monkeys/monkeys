import React from 'react';

import { useMemoizedFn } from 'ahooks';
import { isEmpty } from 'lodash';
import { Circle, CircleDot, Plus, Trash } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { SelectDataLinkage } from '@/components/layout/workspace/vines-view/flow/headless-modal/endpoint/start-tool/workflow-input-config/input-config/input-editor/field/default-value/select-list/data-linkage';
import { TSelectList } from '@/components/layout/workspace/vines-view/form/tabular/render/field/select.tsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { IWorkflowInput } from '@/schema/workspace/workflow-input.ts';

interface ISelectListModeProps extends React.ComponentPropsWithoutRef<'div'> {
  form: UseFormReturn<IWorkflowInput>;

  isNumber: boolean;

  Default: IWorkflowInput['default'];
  type: IWorkflowInput['type'];

  forceUpdate: () => void;
  selectList: TSelectList;

  multipleValues: boolean;
}

export const SelectListMode: React.FC<ISelectListModeProps> = ({
  form,
  Default,
  type,
  forceUpdate,
  selectList,
  multipleValues,
}) => {
  const { t } = useTranslation();

  const handleAddSelectList = useMemoizedFn((e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    form.setValue('selectList', [...selectList, { value: '', label: '' }]);
    forceUpdate();
  });

  const handleUpdateSelectList = useMemoizedFn((index: number, key: 'value' | 'label' | 'linkage', value: any) => {
    if (type === 'number' && key === 'value') {
      value = Number(value);
      if (isNaN(value)) {
        return;
      }
    }

    form.setValue(
      'selectList',
      selectList.map((it, i) => (i === index ? { ...it, [key]: value } : it)),
    );
    forceUpdate();
  });

  const handleRemoveSelectList = useMemoizedFn((e: React.MouseEvent<HTMLButtonElement>, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    form.setValue(
      'selectList',
      selectList.filter((_, i) => i !== index),
    );
    forceUpdate();
  });

  const handleSetDefault = useMemoizedFn((e: React.MouseEvent<HTMLButtonElement>, value: string | number) => {
    e.preventDefault();
    e.stopPropagation();
    if (multipleValues) {
      const rawDefault = form.getValues('default') ?? [];
      if (Array.isArray(rawDefault)) {
        if ((rawDefault as (string | number)[]).includes(value)) {
          form.setValue(
            'default',
            (rawDefault as (string | number)[]).filter((it) => (it === value ? undefined : it)) as string[] | number[],
          );
        } else {
          form.setValue('default', [...(rawDefault as string[] | number[]), value] as string[] | number[]);
        }
      } else {
        form.setValue('default', [value as string]);
      }
    } else {
      form.setValue('default', value);
    }
    forceUpdate();
  });

  const isDefault = (value: string | number) => {
    return multipleValues
      ? ((form.getValues('default') ?? []) as unknown as (string | number)[]).includes(value)
      : Default === value && !isEmpty(Default?.toString());
  };

  return (
    <div className="space-y-2">
      {selectList.map(({ label, value, linkage }, i) => (
        <div key={i} className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                icon={isDefault(value) ? <CircleDot /> : <Circle />}
                className="size-10"
                onClick={(e) => handleSetDefault(e, value)}
              />
            </TooltipTrigger>
            <TooltipContent side="right">
              {t('workspace.flow-view.endpoint.start-tool.input.config-form.default.select.set-default')}
            </TooltipContent>
          </Tooltip>
          <Input
            className="flex-[40%]"
            placeholder={t(
              'workspace.flow-view.endpoint.start-tool.input.config-form.default.select.label-placeholder',
            )}
            value={label}
            onChange={(labelVal) => handleUpdateSelectList(i, 'label', labelVal)}
          />
          <Input
            placeholder={t(
              'workspace.flow-view.endpoint.start-tool.input.config-form.default.select.value-placeholder',
            )}
            value={value}
            type={type === 'number' ? 'number' : 'text'}
            onChange={(defVal) => handleUpdateSelectList(i, 'value', defVal)}
          />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                icon={<Trash />}
                className="size-10"
                onClick={(e) => handleRemoveSelectList(e, i)}
              />
            </TooltipTrigger>
            <TooltipContent side="left">
              {t('workspace.flow-view.endpoint.start-tool.input.config-form.default.select.remove-tips')}
            </TooltipContent>
          </Tooltip>
          {!multipleValues && (
            <SelectDataLinkage
              form={form}
              value={linkage}
              handleUpdate={(value) => handleUpdateSelectList(i, 'linkage', value)}
            />
          )}
        </div>
      ))}
      <Button className="w-full" variant="outline" icon={<Plus />} onClick={handleAddSelectList}>
        {t('workspace.flow-view.endpoint.start-tool.input.config-form.default.select.add')}
      </Button>
    </div>
  );
};
