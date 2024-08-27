import React, { useState } from 'react';

import { Check, ChevronsUpDown } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useComfyuiModelTypes } from '@/apis/comfyui-model';
import { IComfyuiModelType } from '@/apis/comfyui-model/typings.ts';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form.tsx';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { IWorkflowInput } from '@/schema/workspace/workflow-input.ts';
import { cn } from '@/utils';

const getComfyuiModelTypeDisplayName = (type?: IComfyuiModelType) =>
  type ? (type.displayName || type.name) + ' - ' + type.path : 'unknown';

interface IFieldImageModelTypeSelector extends React.ComponentPropsWithoutRef<'div'> {
  form: UseFormReturn<IWorkflowInput>;
}

export const FieldImageModelTypeSelector: React.FC<IFieldImageModelTypeSelector> = ({ form }) => {
  const { t } = useTranslation();

  const [visible, setVisible] = useState(false);

  const { data: types } = useComfyuiModelTypes();

  return (
    <FormField
      name="comfyuiModelTypeName"
      control={form.control}
      render={({ field: { value, ...field } }) => (
        <FormItem>
          <div className="flex items-center justify-between">
            <FormLabel>
              {t('workspace.flow-view.endpoint.start-tool.input.config-form.comfyui-model-type-name.label')}
            </FormLabel>
          </div>
          <FormControl>
            <Popover open={visible} onOpenChange={setVisible}>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant="outline"
                    role="combobox"
                    className={cn('w-full justify-between', !value && 'text-muted-foreground')}
                  >
                    {value
                      ? getComfyuiModelTypeDisplayName(types?.find((t) => t.name === value))
                      : t(
                          'workspace.flow-view.endpoint.start-tool.input.config-form.comfyui-model-type-name.placeholder',
                        )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="p-0">
                <Command>
                  <CommandInput
                    placeholder={t(
                      'workspace.flow-view.endpoint.start-tool.input.config-form.comfyui-model-type-name.command.placeholder',
                    )}
                  />
                  <CommandEmpty>
                    {t(
                      'workspace.flow-view.endpoint.start-tool.input.config-form.comfyui-model-type-name.command.empty',
                    )}
                  </CommandEmpty>
                  <ScrollArea className="h-56">
                    <CommandGroup>
                      {(types ?? []).map((it) => {
                        return (
                          <CommandItem
                            value={it.id}
                            key={it.id}
                            onSelect={() => {
                              field.onChange(it.name);
                              setVisible(false);
                            }}
                          >
                            <Check className={cn('mr-2 h-4 w-4', it.name === value ? 'opacity-100' : 'opacity-0')} />
                            {getComfyuiModelTypeDisplayName(it)}
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </ScrollArea>
                </Command>
              </PopoverContent>
            </Popover>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
