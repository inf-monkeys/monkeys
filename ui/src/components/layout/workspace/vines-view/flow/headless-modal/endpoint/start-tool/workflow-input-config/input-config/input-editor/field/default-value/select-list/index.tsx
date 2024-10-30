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
}

export const SelectListMode: React.FC<ISelectListModeProps> = ({ form, Default, type, forceUpdate, selectList }) => {
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
    form.setValue('default', value);
    forceUpdate();
  });

  return (
    <div className="space-y-2">
      {selectList.map(({ label, value, linkage }, i) => (
        <div key={i} className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                icon={Default === value && !isEmpty(Default?.toString()) ? <CircleDot /> : <Circle />}
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
          <SelectDataLinkage
            form={form}
            value={linkage}
            handleUpdate={(value) => handleUpdateSelectList(i, 'linkage', value)}
          />
        </div>
      ))}
      <Button className="w-full" variant="outline" icon={<Plus />} onClick={handleAddSelectList}>
        {t('workspace.flow-view.endpoint.start-tool.input.config-form.default.select.add')}
      </Button>
    </div>
  );
};
