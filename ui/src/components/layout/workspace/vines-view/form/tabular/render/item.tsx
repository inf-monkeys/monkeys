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
import { Button } from '@/components/ui/button';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useForceUpdate } from '@/hooks/use-force-update.ts';
import { VinesWorkflowVariable } from '@/package/vines-flow/core/tools/typings.ts';
import { IWorkflowInputForm } from '@/schema/workspace/workflow-input-form.ts';
import { IWorkflowInputSelectListLinkage } from '@/schema/workspace/workflow-input.ts';
import { cn, getI18nContent } from '@/utils';

interface IVinesFormFieldItemProps extends React.ComponentPropsWithoutRef<'div'> {
  itemClassName?: string;
  it: VinesWorkflowVariable;
  form: UseFormReturn<IWorkflowInputForm>;
  defValues: IWorkflowInputForm;
  miniMode?: boolean;
  extra?: Record<string, any>;

  linkage?: IWorkflowInputSelectListLinkage;
  setLinkage?: (k: string, v: IWorkflowInputSelectListLinkage) => void;
}

export const VinesFormFieldItem: React.FC<IVinesFormFieldItemProps> = ({
  it,
  form,
  defValues,
  itemClassName,
  miniMode = false,
  extra = {},

  linkage = [],
  setLinkage,
}) => {
  const { t } = useTranslation();

  const forceUpdate = useForceUpdate();

  const { displayName, name, type, description, typeOptions } = it;
  if (type === 'notice') {
    return (
      <div className="col-span-2 w-full px-3">
        <NoticeInput key={name} def={{ displayName }} />
      </div>
    );
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
                      <HelpCircle size={18} className="cursor-pointer fill-gray-7 stroke-slate-1" />
                    </TooltipTrigger>
                    <TooltipContent>{tips}</TooltipContent>
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
                                  ? filterList?.includes(m.serverRelations?.[0]?.apiPath) === filterReserve
                                  : true
                            : void 0
                        }
                      />
                    ) : assetType === 'oneapi-model' ? (
                      <FieldOneApiModels input={it} value={value} onChange={form.setValue} extra={extra} />
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

                    <FieldFile input={it} form={form} value={value} miniMode={miniMode} />

                    <FieldOptions input={it} value={value} onChange={onChange} />

                    {type === 'canvas-assist' && <CanvasAssistedInteraction input={it} id={it.name} form={form} />}
                  </>
                )}
              </>
            </FormControl>
            <FormDescription className="font-bold">{getI18nContent(description)}</FormDescription>

            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
};
