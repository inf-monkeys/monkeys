import React from 'react';

import { isUndefined } from 'lodash';
import { HelpCircle } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { NoticeInput } from '@/components/layout/workspace/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property/components/notice.tsx';
import { FieldImageModel } from '@/components/layout/workspace/vines-view/form/tabular/render/field/assets/image-model.tsx';
import { FieldOneApiModels } from '@/components/layout/workspace/vines-view/form/tabular/render/field/assets/oneapi-models.tsx';
import { FieldBoolean } from '@/components/layout/workspace/vines-view/form/tabular/render/field/boolean.tsx';
import { CanvasAssistedInteraction } from '@/components/layout/workspace/vines-view/form/tabular/render/field/canvas-assisted-interaction';
import { FieldFile } from '@/components/layout/workspace/vines-view/form/tabular/render/field/file';
import { FieldNumber } from '@/components/layout/workspace/vines-view/form/tabular/render/field/number.tsx';
import { FieldOptions } from '@/components/layout/workspace/vines-view/form/tabular/render/field/options.tsx';
import {
  FieldSelect,
  TSelectList,
} from '@/components/layout/workspace/vines-view/form/tabular/render/field/select.tsx';
import { FieldTagInputAndTextarea } from '@/components/layout/workspace/vines-view/form/tabular/render/field/tag-input-and-textarea.tsx';
import { FieldTextInputWithButtons } from '@/components/layout/workspace/vines-view/form/tabular/render/field/text-input-with-buttons.tsx';
import { Button } from '@/components/ui/button';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useForceUpdate } from '@/hooks/use-force-update.ts';
import { VinesWorkflowVariable } from '@/package/vines-flow/core/tools/typings.ts';
import { IWorkflowInputSelectListLinkage } from '@/schema/workspace/workflow-input.ts';
import { IWorkflowInputForm } from '@/schema/workspace/workflow-input-form.ts';
import { cn, getI18nContent } from '@/utils';

interface IVinesFormFieldItemProps extends React.ComponentPropsWithoutRef<'div'> {
  itemClassName?: string;
  it: VinesWorkflowVariable;
  form: UseFormReturn<IWorkflowInputForm>;
  defValues: IWorkflowInputForm;
  miniMode?: boolean;
  extra?: Record<string, any>;
  originalInputImages?: string[]; // 添加原始输入图片属性

  linkage?: IWorkflowInputSelectListLinkage;
  setLinkage?: (k: string, v: IWorkflowInputSelectListLinkage) => void;
}

const isVisible = (
  typeOptions: VinesWorkflowVariable['typeOptions'],
  form: UseFormReturn<IWorkflowInputForm>,
): boolean => {
  const { visibility } = typeOptions || {};
  if (!visibility?.conditions?.length) return true;

  const formValues = form.getValues();
  const { conditions, logic } = visibility;

  const results = conditions.map(({ field, operator: operator, value }) => {
    const fieldValue = formValues[field];
    if (!fieldValue) return false;
    switch (operator) {
      case 'is':
        return fieldValue === value;
      case 'isNot':
        return fieldValue !== value;
      case 'isIn':
        return value.includes(fieldValue);
      case 'isNotIn':
        return !value.includes(fieldValue);
      case 'isGreaterThan':
        return fieldValue > value;
      case 'isLessThan':
        return fieldValue < value;
      case 'isGreaterThanOrEqual':
        return fieldValue >= value;
      case 'isLessThanOrEqual':
        return fieldValue <= value;
    }
    return fieldValue === value;
  });
  switch (logic) {
    case 'AND':
      return results.every(Boolean);
    case 'OR':
      return results.some(Boolean);
  }
  return true;
};

export const VinesFormFieldItem: React.FC<IVinesFormFieldItemProps> = ({
  it,
  form,
  defValues,
  itemClassName,
  miniMode = false,
  extra = {},
  originalInputImages = [],

  linkage = [],
  setLinkage,
}) => {
  const { t } = useTranslation();

  const forceUpdate = useForceUpdate();

  const { displayName, name, type, description, typeOptions } = it;

  console.log('typeOptions', typeOptions);
  console.log('form values', form.getValues());
  // // 计算字段可见性
  // const isVisible = useMemo(() => {
  //   const { visibility } = typeOptions || {};
  //   if (!visibility?.conditions?.length) return true;

  //   const formValues = form.getValues();
  //   const { conditions, logic } = visibility;

  //   const results = conditions.map(({ field, operator: _operator, value }) => {
  //     const fieldValue = formValues[field];
  //     // 目前只支持'is'操作符的完全匹配
  //     return fieldValue === value;
  //   });

  //   return logic === 'AND' ? results.every(Boolean) : results.some(Boolean);
  // }, [typeOptions?.visibility, form.watch()]);

  const visibility = isVisible(typeOptions, form);

  if (type === 'notice') {
    return (
      <div className="col-span-2 w-full px-3">
        <NoticeInput key={name} def={{ displayName }} />
      </div>
    );
  }

  // 字段不可见时直接返回null
  if (!visibility) {
    return null;
  }

  const tips = typeOptions?.tips;

  const selectList = (typeOptions?.selectList ?? []) as TSelectList;
  const enableSelectList = (typeOptions?.enableSelectList ?? false) && selectList.length > 0;

  const enableReset = (typeOptions?.enableReset ?? false) && !isUndefined(defValues?.[name]);
  const singleColumn = typeOptions?.singleColumn ?? false;

  const assetType = typeOptions?.assetType;
  const required = it?.required;

  return (
    <FormField
      key={name}
      name={name}
      control={form.control}
      rules={{ required }}
      render={({ field: { value, onChange, ...field } }) => {
        const targetLinkage = linkage.find((it) => it.name === field.name);
        const filterList = targetLinkage?.selectFilter?.list;
        const filterReserve = targetLinkage?.selectFilter?.reserve;
        const enableFilter = (filterList?.length ?? 0) > 0;
        return (
          <FormItem className={cn('col-span-2', singleColumn && 'col-span-1', itemClassName)} card>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <FormLabel className="font-bold">
                  {required && <span className="text-red-10">* </span>}
                  {getI18nContent(displayName)}
                </FormLabel>
                {tips && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle size={18} className="cursor-pointer text-gray-400 dark:text-gray-500" />
                    </TooltipTrigger>
                    <TooltipContent>{getI18nContent(tips)}</TooltipContent>
                  </Tooltip>
                )}
              </div>
              {enableReset && (
                <Button
                  className="h-6"
                  variant="outline"
                  size="small"
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onChange(defValues[name]);
                    forceUpdate();
                  }}
                >
                  {t('workspace.flow-view.endpoint.start-tool.input.config-form.type-options.reset')}
                </Button>
              )}
            </div>
            <FormControl>
              <>
                {enableSelectList ? (
                  <FieldSelect
                    input={it}
                    onChange={onChange}
                    form={form}
                    value={value}
                    field={field}
                    setLinkage={setLinkage}
                    filter={(m) => (enableFilter ? filterList?.includes(m.value) === filterReserve : true)}
                  />
                ) : (
                  <>
                    {assetType === 'comfyui-model' ? (
                      <FieldImageModel
                        input={it}
                        value={value}
                        onChange={onChange}
                        filter={
                          targetLinkage
                            ? (m) =>
                                enableFilter
                                  ? filterList?.includes(m.serverRelations?.[0]?.path) === filterReserve
                                  : true
                            : void 0
                        }
                      />
                    ) : assetType === 'oneapi-model' ? (
                      <FieldOneApiModels input={it} value={value} onChange={form.setValue} extra={extra} />
                    ) : type === 'string' && !typeOptions?.multipleValues ? (
                      <FieldTextInputWithButtons
                        input={it}
                        value={value}
                        onChange={onChange}
                        form={form}
                        field={field}
                        miniMode={miniMode}
                      />
                    ) : (
                      <FieldTagInputAndTextarea
                        input={it}
                        value={value}
                        onChange={onChange}
                        form={form}
                        field={field}
                        miniMode={miniMode}
                      />
                    )}

                    <FieldNumber input={it} value={value} onChange={onChange} field={field} />

                    <FieldBoolean input={it} value={value} onChange={onChange} form={form} />

                    <FieldFile
                      input={it}
                      form={form}
                      value={value}
                      miniMode={miniMode}
                      originalInputImages={originalInputImages}
                    />

                    <FieldOptions input={it} value={value} onChange={onChange} />

                    {type === 'canvas-assist' && <CanvasAssistedInteraction input={it} id={it.name} form={form} />}
                  </>
                )}
              </>
            </FormControl>
            {description && <FormDescription>{getI18nContent(description)}</FormDescription>}
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
};
