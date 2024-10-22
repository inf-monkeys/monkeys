import React, { useEffect } from 'react';

import { isArray, isBoolean, toNumber } from 'lodash';
import { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { SelectListMode } from '@/components/layout/workspace/vines-view/flow/headless-modal/endpoint/start-tool/workflow-input-config/input-config/input-editor/field/default-value/select-list';
import { BOOLEAN_VALUES } from '@/components/layout/workspace/vines-view/form/tabular/render';
import { FieldGroup, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form.tsx';
import { NumberField, NumberFieldInput } from '@/components/ui/input/number.tsx';
import { TagInput } from '@/components/ui/input/tag';
import { Label } from '@/components/ui/label.tsx';
import { SmoothTransition } from '@/components/ui/smooth-transition-size/SmoothTransition.tsx';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea.tsx';
import { useForceUpdate } from '@/hooks/use-force-update.ts';
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
                <Label>{t('workspace.flow-view.endpoint.start-tool.input.config-form.default.select.label')}</Label>
              </div>
            )}
          </div>
          <FormControl>
            <SmoothTransition>
              {enableSelectList && isEnableSelectList ? (
                <SelectListMode
                  form={form}
                  Default={Default}
                  type={type}
                  forceUpdate={forceUpdate}
                  selectList={selectList}
                  isNumber={isNumber}
                />
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
              ) : isNumber ? (
                <NumberField value={toNumber(value)} aria-label="number input" {...field}>
                  <FieldGroup>
                    <NumberFieldInput />
                  </FieldGroup>
                </NumberField>
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
