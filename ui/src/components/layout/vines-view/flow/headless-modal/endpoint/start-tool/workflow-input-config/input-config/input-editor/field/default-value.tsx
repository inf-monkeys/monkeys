import React, { useEffect } from 'react';

import { useForceUpdate } from '@mantine/hooks';
import { isArray, isBoolean, isEmpty } from 'lodash';
import { Circle, CircleDot, Plus, Trash } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { BOOLEAN_VALUES } from '@/components/layout/vines-view/execution/workflow-input';
import { Button } from '@/components/ui/button';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form.tsx';
import { Input } from '@/components/ui/input';
import { TagInput } from '@/components/ui/input/tag';
import { Label } from '@/components/ui/label.tsx';
import { SmoothTransition } from '@/components/ui/smooth-transition-size/SmoothTransition.tsx';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { IWorkflowInput } from '@/schema/workspace/workflow-input.ts';

interface IFieldDefaultValueProps extends React.ComponentPropsWithoutRef<'div'> {
  form: UseFormReturn<IWorkflowInput>;
}

const ENABLE_TYPE_FOR_SELECT_LIST = ['string', 'number'];

export const FieldDefaultValue: React.FC<IFieldDefaultValueProps> = ({ form }) => {
  const { t } = useTranslation();

  const { default: Default, multipleValues, type, enableSelectList, selectList = [] } = form.getValues();

  const forceUpdate = useForceUpdate();

  const isEnableSelectList = ENABLE_TYPE_FOR_SELECT_LIST.includes(type);

  useEffect(() => {
    if (!isEnableSelectList) {
      if (enableSelectList) {
        form.setValue('enableSelectList', false);
      }
      if (selectList?.length) {
        form.setValue('selectList', []);
      }
    }
  }, [isEnableSelectList]);

  const isNumber = type === 'number';

  const handleAddSelectList = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    form.setValue('selectList', [...selectList, { value: '', label: '' }]);
    forceUpdate();
  };

  const handleUpdateSelectList = (index: number, key: 'value' | 'label', value: string | number) => {
    if (isNumber && key === 'value') {
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
  };

  const handleRemoveSelectList = (e: React.MouseEvent<HTMLButtonElement>, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    form.setValue(
      'selectList',
      selectList.filter((_, i) => i !== index),
    );
    forceUpdate();
  };

  const handleSetDefault = (e: React.MouseEvent<HTMLButtonElement>, value: string | number) => {
    e.preventDefault();
    e.stopPropagation();
    form.setValue('default', value);
    forceUpdate();
  };

  return (
    <FormField
      name="default"
      control={form.control}
      render={({ field: { value, ...field } }) => (
        <FormItem>
          <div className="flex items-center justify-between">
            <FormLabel>{t('workspace.flow-view.endpoint.start-tool.input.config-form.default.label')}</FormLabel>
            {!multipleValues && isEnableSelectList && (
              <div className="flex items-center space-x-2">
                <Switch
                  size="small"
                  checked={enableSelectList ?? false}
                  onCheckedChange={(val) => {
                    form.setValue('enableSelectList', val);
                    if (!selectList?.length) {
                      form.setValue('selectList', []);
                    }
                    forceUpdate();
                  }}
                />
                <Label>列表选择</Label>
              </div>
            )}
          </div>
          <FormControl>
            <SmoothTransition>
              {enableSelectList && isEnableSelectList ? (
                <div className="space-y-2">
                  {selectList.map(({ label, value }, i) => (
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
                        <TooltipContent>设置为默认值</TooltipContent>
                      </Tooltip>
                      <Input
                        className="flex-[40%]"
                        placeholder="别名"
                        value={label}
                        onChange={(labelVal) => handleUpdateSelectList(i, 'label', labelVal)}
                      />
                      <Input
                        placeholder="默认值"
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
                        <TooltipContent>删除</TooltipContent>
                      </Tooltip>
                    </div>
                  ))}
                  <Button className="w-full" variant="outline" icon={<Plus />} onClick={handleAddSelectList}>
                    新增
                  </Button>
                </div>
              ) : multipleValues ? (
                <TagInput
                  placeholder={t('workspace.flow-view.endpoint.start-tool.input.config-form.default.placeholder-list')}
                  value={isArray(value) ? value.map((it: string | number | boolean) => it.toString()) : []}
                  onChange={(value) => form.setValue('default', value)}
                />
              ) : type === 'boolean' ? (
                <Switch
                  checked={isBoolean(value) ? value : BOOLEAN_VALUES.includes((value as string)?.toString())}
                  onCheckedChange={field.onChange}
                />
              ) : (
                <Textarea
                  placeholder={t('workspace.flow-view.endpoint.start-tool.input.config-form.default.placeholder')}
                  className="resize-none"
                  value={value?.toString()}
                  {...field}
                />
              )}
            </SmoothTransition>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
