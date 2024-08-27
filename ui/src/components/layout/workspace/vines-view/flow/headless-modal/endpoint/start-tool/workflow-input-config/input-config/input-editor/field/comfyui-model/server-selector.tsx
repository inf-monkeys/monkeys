import React, { useState } from 'react';

import { Check, ChevronsUpDown } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useComfyuiServers } from '@/apis/comfyui';
import { IComfyuiServer } from '@/apis/comfyui/typings.ts';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form.tsx';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { IWorkflowInput } from '@/schema/workspace/workflow-input.ts';
import { cn } from '@/utils';

const getComfyuiServerDisplayName = (server?: IComfyuiServer) =>
  server ? (server.description && `${server.description} - `) + server.address : 'unknown';

interface IFieldImageModelServerSelector extends React.ComponentPropsWithoutRef<'div'> {
  form: UseFormReturn<IWorkflowInput>;
}

export const FieldImageModelServerSelector: React.FC<IFieldImageModelServerSelector> = ({ form }) => {
  const { t } = useTranslation();

  const [visible, setVisible] = useState(false);

  const { data: servers } = useComfyuiServers();

  return (
    <FormField
      name="comfyuiModelServerId"
      control={form.control}
      render={({ field: { value, ...field } }) => (
        <FormItem>
          <div className="flex items-center justify-between">
            <FormLabel>
              {t('workspace.flow-view.endpoint.start-tool.input.config-form.comfyui-model-server-id.label')}
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
                      ? getComfyuiServerDisplayName(servers?.find((s) => s.id === value))
                      : t(
                          'workspace.flow-view.endpoint.start-tool.input.config-form.comfyui-model-server-id.placeholder',
                        )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="p-0">
                <Command>
                  <CommandInput
                    placeholder={t(
                      'workspace.flow-view.endpoint.start-tool.input.config-form.comfyui-model-server-id.command.placeholder',
                    )}
                  />
                  <CommandEmpty>
                    {t(
                      'workspace.flow-view.endpoint.start-tool.input.config-form.comfyui-model-server-id.command.empty',
                    )}
                  </CommandEmpty>
                  <ScrollArea className="h-56">
                    <CommandGroup>
                      {(servers ?? []).map((it) => {
                        return (
                          <CommandItem
                            value={it.id}
                            key={it.id}
                            onSelect={() => {
                              field.onChange(it.id);
                              setVisible(false);
                            }}
                          >
                            <Check className={cn('mr-2 h-4 w-4', it.id === value ? 'opacity-100' : 'opacity-0')} />
                            {getComfyuiServerDisplayName(it)}
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
