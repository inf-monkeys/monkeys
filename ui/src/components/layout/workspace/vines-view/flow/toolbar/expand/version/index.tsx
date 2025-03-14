import React, { useEffect, useState } from 'react';

import { Check, ChevronsUpDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useWorkflowVersions } from '@/apis/workflow/version';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { useCanvasStore } from '@/store/useCanvasStore';
import { useFlowStore } from '@/store/useFlowStore';
import { cn } from '@/utils';

interface IVinesVersionToolbarProps extends React.ComponentPropsWithoutRef<'div'> {
  version?: number;
  onVersionChange?: (version: number) => void;
}

export const VinesVersionToolbar: React.FC<IVinesVersionToolbarProps> = ({ version = 1, onVersionChange }) => {
  const { t } = useTranslation();

  const setIsLatestWorkflowVersion = useFlowStore((s) => s.setIsLatestWorkflowVersion);
  const workflowId = useFlowStore((s) => s.workflowId);
  const setVisible = useCanvasStore((s) => s.setVisible);

  const { data } = useWorkflowVersions(workflowId);

  const [open, setOpen] = useState(false);

  const vinesVersion = version.toString();

  const workflowVersion = data?.map((it) => it.version).sort((a, b) => b - a) || [];

  useEffect(() => {
    if (data) {
      setIsLatestWorkflowVersion(Math.max(...data.map((x) => x.version)) === version);
    }
  }, [data, vinesVersion]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-28 justify-between">
          {vinesVersion !== '0'
            ? t('workspace.flow-view.version.label', { version: vinesVersion })
            : t('workspace.flow-view.version.placeholder')}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-28 p-0">
        <Command>
          <CommandInput placeholder={t('workspace.flow-view.version.search')} />
          <CommandEmpty>{t('workspace.flow-view.version.search-empty')}</CommandEmpty>
          <ScrollArea className="flex max-h-40 flex-col overflow-y-auto">
            <CommandGroup>
              {workflowVersion.map((id) => {
                const finalId = id.toString();
                return (
                  <CommandItem
                    className="cursor-pointer"
                    key={id}
                    value={finalId}
                    onSelect={(currentValue) => {
                      setOpen(false);
                      if (currentValue === vinesVersion) return;
                      setVisible(false);
                      setTimeout(() => {
                        onVersionChange?.(parseInt(currentValue));
                        setTimeout(() => setVisible(true), 80);
                      }, 164);
                    }}
                  >
                    <Check className={cn('mr-2 h-4 w-4', vinesVersion === finalId ? 'opacity-100' : 'opacity-0')} />
                    {t('workspace.flow-view.version.label', { version: finalId })}
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
