import React, { useEffect, useRef, useState } from 'react';

import { useSetState } from '@mantine/hooks';
import { groupBy } from 'lodash';

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { VariableEditorRefProps } from '@/components/ui/vines-variable-editor';
import { useVinesFlow } from '@/package/vines-flow';
import { IVinesVariable } from '@/package/vines-flow/core/tools/typings.ts';
import { useCanvasStore } from '@/store/useCanvasStore';
import { useFlowStore } from '@/store/useFlowStore';
import VinesEvent from '@/utils/events.ts';

interface IVinesVariableSelectorProps {}

export type VariableInsertType = 'simple' | 'jsonpath' | 'taskReferenceName';

export const VinesVariableSelector: React.FC<IVinesVariableSelectorProps> = () => {
  const { setDisableDialogClose } = useCanvasStore();
  const { workflowId } = useFlowStore();

  const { vines } = useVinesFlow();

  const [open, setOpen] = useState(false);
  const [{ x, y }, setPosition] = useSetState({ x: 0, y: 0 });

  const [variables, setVariables] = useState<IVinesVariable[][]>([]);
  const setInsertVariablesFnRef = useRef<VariableEditorRefProps['insertVariable']>(() => {});
  const insertTypeRef = useRef<VariableInsertType>('simple');

  useEffect(() => {
    const handleOpen = (
      _wid: string,
      e: React.MouseEvent<MouseEvent>,
      setVariablesFn: VariableEditorRefProps['insertVariable'],
      insertType: VariableInsertType = 'simple',
    ) => {
      if (workflowId !== _wid) return;

      const { clientX, clientY } = e;
      setPosition({ x: clientX, y: clientY });

      setVariables(
        Object.values(
          groupBy(
            (vines.generateWorkflowVariables().variables || [])
              .flatMap((it) => [it, it.children])
              .flat() as IVinesVariable[],
            (it) => it.group.id,
          ),
        ),
      );
      setInsertVariablesFnRef.current = setVariablesFn;
      insertTypeRef.current = insertType;

      setOpen(true);
      setDisableDialogClose(true);
    };
    VinesEvent.on('flow-variable-selector', handleOpen);
    return () => {
      VinesEvent.off('flow-variable-selector', handleOpen);
    };
  }, [workflowId]);

  return (
    <Popover
      open={open}
      onOpenChange={(val) => {
        setOpen(val);
        setDisableDialogClose(false);
      }}
    >
      <PopoverTrigger asChild>
        <div
          className="fixed left-0 top-0 z-20 opacity-0"
          style={{ transform: `translate(calc(${x}px - 4px), calc(${y}px - 10px))` }}
        >
          _
        </div>
      </PopoverTrigger>
      <PopoverContent className="p-0">
        <Command>
          <CommandList>
            <CommandInput placeholder="搜索变量..." />
            <CommandEmpty>找不到变量</CommandEmpty>
          </CommandList>
          <CommandSeparator />
          <CommandList>
            {variables.map((it, index) => (
              <CommandGroup key={index} heading={it[0].group.name}>
                {it.map(({ label, originalName, id, jsonpath, targetId }, i) => (
                  <CommandItem
                    key={i}
                    onSelect={() => {
                      if (insertTypeRef.current === 'jsonpath') {
                        setInsertVariablesFnRef.current(jsonpath);
                      } else if (insertTypeRef.current === 'taskReferenceName') {
                        setInsertVariablesFnRef.current(targetId);
                      } else {
                        setInsertVariablesFnRef.current(id);
                      }
                      setOpen(false);
                      setDisableDialogClose(false);
                    }}
                  >
                    {label}
                    <CommandShortcut>
                      {originalName.length > 20 ? `${originalName.slice(0, 20)}...` : originalName}
                    </CommandShortcut>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
