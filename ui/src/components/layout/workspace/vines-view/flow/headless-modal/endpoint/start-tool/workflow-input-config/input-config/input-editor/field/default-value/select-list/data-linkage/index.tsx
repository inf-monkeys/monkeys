import React, { useState } from 'react';

import { useDynamicList } from 'ahooks';
import { Link, Plus, Trash2 } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { SelectFilter } from '@/components/layout/workspace/vines-view/flow/headless-modal/endpoint/start-tool/workflow-input-config/input-config/input-editor/field/default-value/select-list/data-linkage/select-filter.tsx';
import { AutosizeTextarea } from '@/components/ui/autosize-textarea.tsx';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useVinesFlow } from '@/package/vines-flow';
import { IWorkflowInput, IWorkflowInputSelectListLinkage } from '@/schema/workspace/workflow-input.ts';
import { cn, getI18nContent } from '@/utils';

interface ISelectDataLinkageProps extends React.ComponentPropsWithoutRef<'div'> {
  form: UseFormReturn<IWorkflowInput>;

  handleUpdate?: (value: any) => void;

  value?: IWorkflowInputSelectListLinkage;
}

export const SelectDataLinkage: React.FC<ISelectDataLinkageProps> = ({
  form,
  handleUpdate,
  value: defaultList = [],
}) => {
  const { t } = useTranslation();

  const [open, setOpen] = useState(false);

  const { vines } = useVinesFlow();

  const { name: currentFieldName } = form.getValues();
  const workflowInput = vines.workflowInput.filter(({ name }) => currentFieldName !== name);

  const { list, remove, push, replace } = useDynamicList(defaultList);

  const disabledAdd = list.length === workflowInput.length;

  return (
    <Popover
      open={open}
      onOpenChange={(val) => {
        setOpen(val);
        if (!val) {
          handleUpdate?.(
            list.some(({ name, value, selectFilter }) => name && (value || (selectFilter?.list?.length ?? 0) >= 1))
              ? list
              : [],
          );
        }
      }}
    >
      <Tooltip>
        <PopoverTrigger asChild>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              icon={<Link />}
              className="size-10"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setOpen((prev) => !prev);
              }}
            />
          </TooltipTrigger>
        </PopoverTrigger>
        <TooltipContent side="left">
          {t('workspace.flow-view.endpoint.start-tool.input.config-form.default.select.linkage.tips')}
        </TooltipContent>
      </Tooltip>
      <PopoverContent className="w-auto" onWheel={(e) => e.stopPropagation()} onTouchMove={(e) => e.stopPropagation()}>
        <div className="grid min-w-96 gap-4">
          <div className="space-y-2">
            <h4 className="text-sm font-medium leading-none">
              {t('workspace.flow-view.endpoint.start-tool.input.config-form.default.select.linkage.tips')}
            </h4>
            <p className="max-w-96 text-xs text-muted-foreground">
              {t('workspace.flow-view.endpoint.start-tool.input.config-form.default.select.linkage.desc')}
            </p>
          </div>
          <ScrollArea
            className={cn(
              '-mr-3 flex max-h-60 flex-col overflow-y-auto pr-3 [&>div>div]:grid [&>div>div]:gap-4 [&>div>div]:p-1',
              !list.length && '-my-4',
            )}
          >
            {list.map(({ name, value, selectFilter }, i) => {
              const input = workflowInput.find(({ name: itName }) => itName === name);

              return (
                <div className="flex items-start gap-2" key={i}>
                  <Select
                    value={name}
                    onValueChange={(val) => {
                      if (value) {
                        replace(i, { name: val, value });
                      } else {
                        replace(i, { name: val, value: input?.default?.toString() ?? '' });
                      }
                    }}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue
                        placeholder={t(
                          'workspace.flow-view.endpoint.start-tool.input.config-form.default.select.linkage.select-placeholder',
                        )}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <ScrollArea className="flex max-h-40 flex-col overflow-y-auto">
                        {workflowInput.map(({ name: itName, displayName }) => (
                          <SelectItem
                            key={itName}
                            value={itName}
                            disabled={list.some(({ name: itName2 }, j) => j !== i && itName2 === itName)}
                          >
                            {getI18nContent(displayName)}
                          </SelectItem>
                        ))}
                      </ScrollArea>
                    </SelectContent>
                  </Select>
                  <AutosizeTextarea
                    minHeight={36}
                    disabled={!name}
                    value={value?.toString()}
                    onChange={(val) => replace(i, { name, value: val.target.value })}
                    placeholder={t(
                      'workspace.flow-view.endpoint.start-tool.input.config-form.default.select.linkage.value-placeholder',
                    )}
                  />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button icon={<Trash2 />} size="small" variant="outline" onClick={() => remove(i)} />
                    </TooltipTrigger>
                    <TooltipContent side="left">{t('common.utils.delete')}</TooltipContent>
                  </Tooltip>
                  <SelectFilter
                    input={input}
                    selectFilter={selectFilter}
                    onChange={(v) => replace(i, { name, value, selectFilter: v })}
                  />
                </div>
              );
            })}
          </ScrollArea>

          <Button
            variant="outline"
            size="small"
            icon={<Plus />}
            onClick={() => push({ name: '', value: '' })}
            disabled={disabledAdd}
          >
            {t('workspace.flow-view.endpoint.start-tool.input.config-form.default.select.linkage.add')}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
