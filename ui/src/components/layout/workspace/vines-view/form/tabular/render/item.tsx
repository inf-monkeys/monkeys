import React from 'react';

import { isUndefined } from 'lodash';
import { HelpCircle } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { NoticeInput } from '@/components/layout/workspace/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property/components/notice.tsx';
import { FieldBoolean } from '@/components/layout/workspace/vines-view/form/tabular/render/field/boolean.tsx';
import { FieldFile } from '@/components/layout/workspace/vines-view/form/tabular/render/field/file';
import { FieldNumber } from '@/components/layout/workspace/vines-view/form/tabular/render/field/number.tsx';
import { FieldOptions } from '@/components/layout/workspace/vines-view/form/tabular/render/field/options.tsx';
import { FieldTagInputAndTextarea } from '@/components/layout/workspace/vines-view/form/tabular/render/field/tag-input-and-textarea.tsx';
import { Button } from '@/components/ui/button';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form.tsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useForceUpdate } from '@/hooks/use-force-update.ts';
import { VinesWorkflowVariable } from '@/package/vines-flow/core/tools/typings.ts';
import { IWorkflowInputForm } from '@/schema/workspace/workflow-input-form.ts';
import { cn, getI18nContent } from '@/utils';

interface IVinesFormFieldItemProps extends React.ComponentPropsWithoutRef<'div'> {
  itemClassName?: string;
  it: VinesWorkflowVariable;
  form: UseFormReturn<IWorkflowInputForm>;
  defValues: IWorkflowInputForm;
  miniMode?: boolean;
}

export const VinesFormFieldItem: React.FC<IVinesFormFieldItemProps> = ({
  it,
  form,
  defValues,
  itemClassName,
  miniMode = false,
}) => {
  const { t } = useTranslation();

  const forceUpdate = useForceUpdate();

  const { displayName, name, type, description, typeOptions } = it;
  if (type === 'notice') {
    return <NoticeInput key={name} def={{ displayName }} />;
  }

  const tips = typeOptions?.tips;

  const selectList = (typeOptions?.selectList ?? []) as { value: string; label: string }[];
  const enableSelectList = (typeOptions?.enableSelectList ?? false) && selectList.length > 0;

  const enableReset = (typeOptions?.enableReset ?? false) && !isUndefined(defValues?.[name]);
  const singleColumn = typeOptions?.singleColumn ?? false;

  return (
    <FormField
      key={name}
      name={name}
      control={form.control}
      render={({ field: { value, onChange, ...field } }) => (
        <FormItem className={cn('col-span-2 px-3', singleColumn && 'col-span-1', itemClassName)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <FormLabel className="font-bold">{getI18nContent(displayName)}</FormLabel>
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
                <Select
                  onValueChange={(val) => {
                    onChange(type === 'number' ? Number(val) : val);
                  }}
                  value={value?.toString() ?? ''}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t('workspace.pre-view.actuator.execution-form.select', { displayName })}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {selectList.map((it, i) => (
                      <SelectItem value={it.value?.toString()} key={i}>
                        {it.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <>
                  <FieldTagInputAndTextarea
                    input={it}
                    value={value}
                    onChange={onChange}
                    form={form}
                    field={field}
                    miniMode={miniMode}
                  />

                  <FieldNumber input={it} value={value} onChange={onChange} field={field} />

                  <FieldBoolean input={it} value={value} onChange={onChange} form={form} />

                  <FieldFile input={it} form={form} value={value} miniMode={miniMode} />

                  <FieldOptions input={it} value={value} onChange={onChange} />
                </>
              )}
            </>
          </FormControl>
          <FormDescription className="font-bold">{getI18nContent(description)}</FormDescription>

          <FormMessage />
        </FormItem>
      )}
    />
  );
};
