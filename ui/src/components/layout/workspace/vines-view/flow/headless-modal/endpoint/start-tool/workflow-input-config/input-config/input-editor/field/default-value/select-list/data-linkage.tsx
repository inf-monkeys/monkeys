import React, { useState } from 'react';

import { useDynamicList } from 'ahooks';
import { Link, Plus, Trash2 } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { AutosizeTextarea } from '@/components/ui/autosize-textarea.tsx';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useVinesFlow } from '@/package/vines-flow';
import { IWorkflowInput, IWorkflowInputSelectListLinkage } from '@/schema/workspace/workflow-input.ts';
import { getI18nContent } from '@/utils';

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
          handleUpdate?.(list.some(({ name, value }) => name && value) ? list : []);
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
      <PopoverContent className="w-auto">
        <div className="grid min-w-96 gap-4">
          <div className="space-y-2">
            <h4 className="text-sm font-medium leading-none">
              {t('workspace.flow-view.endpoint.start-tool.input.config-form.default.select.linkage.tips')}
            </h4>
            <p className="max-w-96 text-xs text-muted-foreground">
              {t('workspace.flow-view.endpoint.start-tool.input.config-form.default.select.linkage.desc')}
            </p>
          </div>
          {list.map(({ name, value }, i) => (
            <div className="flex items-start gap-2" key={i}>
              <Select
                value={name}
                onValueChange={(val) => {
                  if (value) {
                    replace(i, { name: val, value });
                  } else {
                    const itDefault = workflowInput.find(({ name: itName }) => itName === val)?.default;
                    replace(i, { name: val, value: itDefault?.toString() ?? '' });
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
                  {workflowInput.map(({ name: itName, displayName }) => (
                    <SelectItem
                      key={itName}
                      value={itName}
                      disabled={list.some(({ name: itName2 }, j) => j !== i && itName2 === itName)}
                    >
                      {getI18nContent(displayName)}
                    </SelectItem>
                  ))}
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
              <Button icon={<Trash2 />} size="small" variant="outline" onClick={() => remove(i)} />
            </div>
          ))}
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
