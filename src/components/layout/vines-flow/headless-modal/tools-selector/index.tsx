import React, { useEffect, useState } from 'react';

import { Search } from 'lucide-react';

import { ToolLists } from '@/components/layout/vines-flow/headless-modal/tools-selector/list.tsx';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input.tsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.tsx';
import { VinesToolDef } from '@/package/vines-flow/core/tools/typings.ts';
import { useVinesFlow } from '@/package/vines-flow/use.ts';
import VinesEvent from '@/utils/events';

interface IToolsSelectorProps extends React.ComponentPropsWithoutRef<'div'> {}

export const ToolsSelector: React.FC<IToolsSelectorProps> = () => {
  const { vines } = useVinesFlow();

  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const [targetNodeId, setTargetNodeId] = useState<string>('');
  const [disabledSelector, setDisabledSelector] = useState(false);
  const [isInsertBefore, setIsInsertBefore] = useState(false);

  useEffect(() => {
    const handleOpen = ({ targetNodeId: targetId, disabled = false, insertBefore = false }) => {
      setOpen(true);
      setTargetNodeId(targetId);
      setDisabledSelector(disabled);
      setIsInsertBefore(insertBefore);
    };
    VinesEvent.on('flow-select-nodes', handleOpen);
    return () => {
      VinesEvent.off('flow-select-nodes', handleOpen);
    };
  }, []);

  const handleOnClick = (tool: VinesToolDef) => {
    if (disabledSelector) return;
    setOpen(false);

    console.log(tool);
  };

  const list = vines.getToolsByCategory(searchValue);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-[50rem]">
        <DialogTitle>选择工具</DialogTitle>
        <div className="relative flex w-full items-center">
          <Search className="absolute ml-3 size-4 shrink-0 opacity-50" />
          <Input className="pl-9" placeholder="输入关键词或类别来搜索工具" onChange={setSearchValue} />
        </div>
        <Tabs defaultValue="all">
          <TabsList>
            {list.map(([, , categoryKey, category], index) => (
              <TabsTrigger value={categoryKey} key={index}>
                {category}
              </TabsTrigger>
            ))}
          </TabsList>
          {list.map(([list, length, category], index) => (
            <TabsContent value={category} key={index}>
              <ToolLists list={list} length={length} category={category} onClick={handleOnClick} />
            </TabsContent>
          ))}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
