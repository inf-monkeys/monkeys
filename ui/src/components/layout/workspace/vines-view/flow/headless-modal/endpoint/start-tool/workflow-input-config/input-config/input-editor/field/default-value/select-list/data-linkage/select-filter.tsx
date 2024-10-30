import React, { useState } from 'react';

import { useCreation, useDynamicList } from 'ahooks';
import { Filter, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { FieldImageModel } from '@/components/layout/workspace/vines-view/form/tabular/render/field/assets/image-model.tsx';
import { TSelectList } from '@/components/layout/workspace/vines-view/form/tabular/render/field/select.tsx';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label.tsx';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.tsx';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { VinesWorkflowVariable } from '@/package/vines-flow/core/tools/typings.ts';

type TSelectFilter = { list: string[]; reserve: boolean };

interface ISelectFilterProps {
  input?: VinesWorkflowVariable;
  selectFilter?: TSelectFilter;
  onChange?: (value: TSelectFilter) => void;
}

export const SelectFilter: React.FC<ISelectFilterProps> = ({ input, selectFilter, onChange }) => {
  const { t } = useTranslation();

  const typeOptions = input?.typeOptions;
  const assetType = typeOptions?.assetType ?? '';

  const [tempValue, setTempValue] = useState<string>('');

  const selectList = (typeOptions?.selectList ?? []) as TSelectList;

  const visible = useCreation(() => {
    return selectList.length > 0 || ['comfyui-model'].includes(assetType);
  }, [selectList, assetType]);

  const { list, remove, push } = useDynamicList<string>(selectFilter?.list ?? []);

  const reserve = selectFilter?.reserve ?? false;

  return (
    visible && (
      <Popover onOpenChange={(open) => !open && onChange?.({ list, reserve })}>
        <Tooltip>
          <PopoverTrigger asChild>
            <TooltipTrigger asChild>
              <Button icon={<Filter />} size="small" variant="outline" />
            </TooltipTrigger>
          </PopoverTrigger>
          <TooltipContent side="left">
            {t(
              'workspace.flow-view.endpoint.start-tool.input.config-form.default.select.linkage.filter-select-list.label',
            )}
          </TooltipContent>
        </Tooltip>
        <PopoverContent className="w-auto">
          <div className="grid gap-4">
            <div className="flex items-center justify-between gap-2">
              <div className="space-y-2">
                <h4 className="text-sm font-medium leading-none">
                  {t(
                    'workspace.flow-view.endpoint.start-tool.input.config-form.default.select.linkage.filter-select-list.label',
                  )}
                </h4>
                <p className="max-w-96 text-xs text-muted-foreground">
                  {t(
                    'workspace.flow-view.endpoint.start-tool.input.config-form.default.select.linkage.filter-select-list.desc',
                  )}
                </p>
              </div>
              <div className="-mr-3.5 flex w-24 items-center space-x-2">
                <Switch size="small" checked={reserve} onCheckedChange={(v) => onChange?.({ list, reserve: v })} />
                <Label>
                  {t(
                    'workspace.flow-view.endpoint.start-tool.input.config-form.default.select.linkage.filter-select-list.reserve',
                  )}
                </Label>
              </div>
            </div>
            <ScrollArea className="flex max-h-32 flex-col overflow-y-auto [&>div>div]:space-y-2">
              {list.map((value, i) => (
                <div key={i} className="flex items-center justify-between gap-2">
                  <p className="text-sm">{value}</p>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button icon={<Trash2 />} size="small" variant="outline" onClick={() => remove(i)} />
                    </TooltipTrigger>
                    <TooltipContent side="left">{t('common.utils.delete')}</TooltipContent>
                  </Tooltip>
                </div>
              ))}
            </ScrollArea>

            <div className="flex items-center justify-between gap-2">
              {input ? (
                assetType === 'comfyui-model' ? (
                  <FieldImageModel
                    input={input}
                    value={tempValue}
                    onChange={(v) => setTempValue(v)}
                    filter={(m) => !list.some((v) => v === m.serverRelation.apiPath)}
                  />
                ) : (
                  <Select onValueChange={setTempValue} value={tempValue}>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={t('workspace.pre-view.actuator.execution-form.select', {
                          displayName: input.displayName,
                        })}
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
                )
              ) : (
                'ERROR'
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="small"
                    icon={<Plus />}
                    onClick={() => push(tempValue)}
                    disabled={list.some((v) => v === tempValue) || !tempValue}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  {t(
                    'workspace.flow-view.endpoint.start-tool.input.config-form.default.select.linkage.filter-select-list.add',
                  )}
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    )
  );
};
