import React, { useState } from 'react';

import { Check, ChevronsUpDown } from 'lucide-react';
import { ControllerRenderProps, FieldValues, UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useComfyuiModelListByTypeNameAndServerId } from '@/apis/comfyui-model';
import { IComfyuiModelWithOneServer } from '@/apis/comfyui-model/typings.ts';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { FormControl } from '@/components/ui/form.tsx';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { Tag } from '@/components/ui/tag';
import { VinesIcon } from '@/components/ui/vines-icon';
import { VinesWorkflowVariable } from '@/package/vines-flow/core/tools/typings.ts';
import { IWorkflowInputForm } from '@/schema/workspace/workflow-input-form.ts';
import { cn } from '@/utils';

interface IFieldImageModelProps {
  input: VinesWorkflowVariable;
  value: any;
  onChange: (value: any) => void;
  form: UseFormReturn<IWorkflowInputForm>;
  field: Omit<ControllerRenderProps<FieldValues, string>, 'value' | 'onChange'>;
}

export const FieldImageModel: React.FC<IFieldImageModelProps> = ({ input: { typeOptions }, value, onChange }) => {
  const { t } = useTranslation();

  const [visible, setVisible] = useState(false);

  const { data: rawModels } = useComfyuiModelListByTypeNameAndServerId(
    typeOptions?.comfyuiModelTypeName,
    typeOptions?.comfyuiModelServerId,
  );

  const models = (rawModels ?? [])
    .map(({ serverRelations, ...raw }) => {
      const serverRelation = serverRelations.find((r) => r.server.id === typeOptions?.comfyuiModelServerId);
      return {
        ...raw,
        serverRelation,
      };
    })
    .filter((m) => m.serverRelation) as IComfyuiModelWithOneServer[];

  const selectedModel = models?.find((m) => m.serverRelation?.path === value);

  return (
    <Popover open={visible} onOpenChange={setVisible}>
      <PopoverTrigger asChild>
        <FormControl>
          <Button
            variant="outline"
            role="combobox"
            className={cn('w-full justify-between', !value && 'text-muted-foreground')}
          >
            {value ? (
              <div className="flex items-center gap-2">
                <VinesIcon src={selectedModel?.iconUrl || 'emoji:🍀:#ceefc5'} size="xs" />
                <span>{selectedModel?.displayName}</span>
              </div>
            ) : (
              t('workspace.pre-view.actuator.execution-form.image-model.placeholder')
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </FormControl>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder={t('workspace.pre-view.actuator.execution-form.image-model.command.placeholder')} />
          <CommandEmpty>{t('workspace.pre-view.actuator.execution-form.image-model.command.empty')}</CommandEmpty>
          <ScrollArea className="h-56">
            <CommandGroup>
              {(models ?? []).map((it) => {
                return (
                  <CommandItem
                    value={it.id}
                    key={it.id}
                    onSelect={() => {
                      onChange(it.serverRelation.path);
                      setVisible(false);
                    }}
                    className="flex justify-between gap-2"
                  >
                    <div className="flex items-center gap-2">
                      <VinesIcon src={it.iconUrl || 'emoji:🍀:#ceefc5'} size="xs" />
                      <div>
                        <div className="flex gap-1">
                          <p>{it.displayName}</p>
                          {it.serverRelation.type && (
                            <Tag color="tertiary" size="xs">
                              {it.serverRelation.type.displayName || it.serverRelation.type.name}
                            </Tag>
                          )}
                        </div>
                        <p className="text-xs opacity-70">
                          {it.description || t('components.layout.ugc.utils.no-description')}
                        </p>
                      </div>
                    </div>
                    <Check className={cn('h-4 w-4', it.serverRelation.path === value ? 'opacity-100' : 'opacity-0')} />
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </ScrollArea>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
