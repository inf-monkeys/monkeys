import React, { useEffect, useRef, useState } from 'react';

import { useSetState } from 'ahooks';
import { groupBy, isObject } from 'lodash';
import { useTranslation } from 'react-i18next';

import { VariableChildren } from '@/components/layout/workspace/vines-view/flow/headless-modal/variable-selector/children.tsx';
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
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { VariableEditorRefProps } from '@/components/ui/vines-variable-editor';
import { useVinesFlow } from '@/package/vines-flow';
import { IVinesVariable } from '@/package/vines-flow/core/tools/typings.ts';
import { useCanvasStore } from '@/store/useCanvasStore';
import { useFlowStore } from '@/store/useFlowStore';
import { getI18nContent } from '@/utils';
import VinesEvent from '@/utils/events.ts';

interface IVinesVariableSelectorProps {}

export type VariableInsertType = 'simple' | 'jsonpath' | 'taskReferenceName';

export const VinesVariableSelector: React.FC<IVinesVariableSelectorProps> = () => {
  const { t } = useTranslation();

  const setDisableDialogClose = useCanvasStore((s) => s.setDisableDialogClose);
  const workflowId = useFlowStore((s) => s.workflowId);

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
            (vines.generateWorkflowVariables().variables || []).map((it) => {
              if (isObject(it.label)) {
                it.label = getI18nContent(it.label) ?? '';
              }
              return it;
            }),
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

  const handleOnSelected = (id: string, jsonpath: string, targetId: string) => {
    if (insertTypeRef.current === 'jsonpath') {
      setInsertVariablesFnRef.current(jsonpath);
    } else if (insertTypeRef.current === 'taskReferenceName') {
      setInsertVariablesFnRef.current(targetId);
    } else {
      setInsertVariablesFnRef.current(id);
    }
    setOpen(false);
    setDisableDialogClose(false);
  };

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
      <PopoverContent className="p-0" onWheel={(e) => e.stopPropagation()} onTouchMove={(e) => e.stopPropagation()}>
        <Command>
          <CommandList>
            <CommandInput placeholder={t('workspace.flow-view.headless-modal.variable-selector.search-placeholder')} />
            <CommandEmpty>{t('workspace.flow-view.headless-modal.variable-selector.search-empty')}</CommandEmpty>
          </CommandList>
          <CommandSeparator />
          <CommandList>
            <ScrollArea className="flex max-h-64 flex-col overflow-y-auto">
              {variables.map((it, index) => (
                <CommandGroup key={index} heading={it[0].group.name}>
                  {it.map(({ label, originalName, id, jsonpath, targetId, children }, i) => (
                    <CommandItem key={i} onSelect={() => handleOnSelected(id, jsonpath, targetId)}>
                      {label}
                      <CommandShortcut>
                        {originalName.length > 20 ? `${originalName.slice(0, 20)}...` : originalName}
                      </CommandShortcut>
                      {children && children.length > 0 && (
                        <VariableChildren
                          name={label}
                          onSelected={(childId, childJsonpath, childTargetId) =>
                            handleOnSelected(childId, childJsonpath, childTargetId)
                          }
                        >
                          {children}
                        </VariableChildren>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </ScrollArea>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
