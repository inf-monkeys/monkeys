import React, { useEffect, useState } from 'react';

import { Check, ChevronsUpDown } from 'lucide-react';

import { useWorkflowVersions } from '@/apis/workflow/version';
import { WorkflowRelease } from '@/components/layout/vines-flow/toolbar/version/release.tsx';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card.tsx';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { useVinesFlow } from '@/package/vines-flow';
import { useFlowStore } from '@/store/useFlowStore';
import { cn } from '@/utils';

interface IVinesVersionToolbarProps extends React.ComponentPropsWithoutRef<'div'> {}

export const VinesVersionToolbar: React.FC<IVinesVersionToolbarProps> = () => {
  const { workflowId, setVisible, setIsLatestWorkflowVersion } = useFlowStore();
  const { vines } = useVinesFlow();
  const { data } = useWorkflowVersions(workflowId);

  const [open, setOpen] = useState(false);

  const vinesVersion = vines.version.toString();

  const workflowVersion = data?.map((it) => it.version) || [];

  useEffect(() => {
    if (data) {
      setIsLatestWorkflowVersion(Math.max(...data.map((x) => x.version)) === vines.version);
    }
  }, [data, vinesVersion]);

  return (
    <Card className="absolute right-0 top-0 z-40 m-4 flex flex-nowrap gap-2 p-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" aria-expanded={open} className="w-28 justify-between">
            {vinesVersion !== '0' ? `版本 ${vinesVersion}` : '选择版本'}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-28 p-0">
          <Command>
            <CommandInput placeholder="搜索版本" />
            <CommandEmpty>找不到此版本</CommandEmpty>
            <ScrollArea className="h-36">
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
                          vines.update({ version: parseInt(currentValue) });
                          setTimeout(() => setVisible(true), 80);
                        }, 164);
                      }}
                    >
                      <Check className={cn('mr-2 h-4 w-4', vinesVersion === finalId ? 'opacity-100' : 'opacity-0')} />
                      版本 {finalId}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </ScrollArea>
          </Command>
        </PopoverContent>
      </Popover>
      <WorkflowRelease />
    </Card>
  );
};
