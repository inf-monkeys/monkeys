import React, { useState } from 'react';

import { Check, ChevronsUpDown } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { WORKFLOW_INPUT_TYPE_OPTION_LIST } from '@/components/layout/workspace/vines-view/flow/headless-modal/endpoint/start-tool/workflow-input-config/input-config/consts.ts';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form.tsx';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { IWorkflowInput } from '@/schema/workspace/workflow-input.ts';
import { cn } from '@/utils';

interface IFieldTypeProps extends React.ComponentPropsWithoutRef<'div'> {
  form: UseFormReturn<IWorkflowInput>;

  forceUpdate: React.DispatchWithoutAction;
}

export const FieldType: React.FC<IFieldTypeProps> = ({ form, forceUpdate }) => {
  const { t } = useTranslation();

  const { multipleValues, assetType } = form.getValues();

  const [visible, setVisible] = useState(false);

  return (
    <FormField
      name="type"
      control={form.control}
      render={({ field }) => {
        const buttonLabel = WORKFLOW_INPUT_TYPE_OPTION_LIST.find(
          (it) => it.value === field.value && it.multipleValues === multipleValues && it.assetType === assetType,
        )?.label;

        return (
          <FormItem>
            <FormLabel>{t('workspace.flow-view.endpoint.start-tool.input.config-form.type.label')}</FormLabel>
            <Popover open={visible} onOpenChange={setVisible}>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant="outline"
                    role="combobox"
                    className={cn('w-full justify-between', !field.value && 'text-muted-foreground')}
                  >
                    {field.value
                      ? t('workspace.flow-view.endpoint.start-tool.input.config-form.type.' + buttonLabel, {
                          extra: multipleValues
                            ? t('workspace.flow-view.endpoint.start-tool.input.config-form.type.list')
                            : '',
                        })
                      : t('workspace.flow-view.endpoint.start-tool.input.config-form.type.button')}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent
                className="p-0"
                onWheel={(e) => e.stopPropagation()}
                onTouchMove={(e) => e.stopPropagation()}
              >
                <Command>
                  <CommandInput
                    placeholder={t('workspace.flow-view.endpoint.start-tool.input.config-form.type.placeholder')}
                  />
                  <CommandEmpty>
                    {t('workspace.flow-view.endpoint.start-tool.input.config-form.type.search-empty')}
                  </CommandEmpty>
                  <ScrollArea className="flex max-h-52 flex-col overflow-y-auto">
                    <CommandGroup>
                      {WORKFLOW_INPUT_TYPE_OPTION_LIST.map((it, i) => {
                        const labelVal = t(
                          'workspace.flow-view.endpoint.start-tool.input.config-form.type.' + it.label,
                          {
                            extra: it.multipleValues
                              ? t('workspace.flow-view.endpoint.start-tool.input.config-form.type.list')
                              : '',
                          },
                        );
                        return (
                          <CommandItem
                            value={labelVal}
                            key={i}
                            onSelect={() => {
                              form.setValue('type', it.value as IWorkflowInput['type']);
                              form.setValue('multipleValues', it.multipleValues);
                              form.setValue('assetType', it.assetType);
                              setVisible(false);
                              forceUpdate();
                            }}
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                it.value === field.value &&
                                  it.multipleValues === multipleValues &&
                                  it.assetType === assetType
                                  ? 'opacity-100'
                                  : 'opacity-0',
                              )}
                            />
                            {labelVal}
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </ScrollArea>
                </Command>
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
};
