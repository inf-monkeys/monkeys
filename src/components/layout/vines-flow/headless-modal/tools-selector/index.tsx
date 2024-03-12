import React, { useEffect, useRef, useState } from 'react';

import { useParams } from '@tanstack/react-router';

import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { toast } from 'sonner';

import { ToolLists } from '@/components/layout/vines-flow/headless-modal/tools-selector/list.tsx';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input.tsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.tsx';
import { VinesToolDef, VinesToolWithCategory } from '@/package/vines-flow/core/tools/typings.ts';
import { useVinesFlow } from '@/package/vines-flow/use.ts';
import { useFlowStore } from '@/store/useFlowStore';
import VinesEvent from '@/utils/events';

interface IToolsSelectorProps extends React.ComponentPropsWithoutRef<'div'> {}

export const ToolsSelector: React.FC<IToolsSelectorProps> = () => {
  const { workflowId } = useParams({ from: '/$teamId/workspace/$workflowId/$pageId' });
  const { setZoomToNodeId } = useFlowStore();
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

    const node = vines.createNode(tool);
    if (!node) {
      toast.error('创建节点失败');
      return;
    }

    const finalTargetNodeId = targetNodeId || (vines.getAllNodes()?.at(-1)?.id ?? '');
    vines.insertNode(finalTargetNodeId, node, isInsertBefore ?? false);

    setZoomToNodeId(Array.isArray(node) ? node[0].id : node.id);
  };

  const list = vines
    .getToolsByCategory(searchValue)
    .map(([tools, ...it]) => [
      tools.filter(({ name }) => !name.endsWith(workflowId)),
      ...it,
    ]) as VinesToolWithCategory[];

  const tabsNode = useRef<HTMLDivElement>(null);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-[50rem]">
        <DialogTitle>选择工具</DialogTitle>
        <div className="relative flex w-full items-center">
          <Search className="absolute ml-3 size-4 shrink-0 opacity-50" />
          <Input className="pl-9" placeholder="输入关键词或类别来搜索工具" onChange={setSearchValue} />
        </div>
        <Tabs defaultValue="all">
          <div className="flex justify-between">
            <div ref={tabsNode} className="max-w-[690px] overflow-x-hidden overflow-y-clip">
              <TabsList>
                {list.map(([, , categoryKey, category], index) => (
                  <TabsTrigger value={categoryKey} key={index}>
                    {category}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            <div className="relative flex items-center">
              <div className="pointer-events-none absolute -left-4 h-full w-10 bg-gradient-to-l from-white from-60%" />
              <Button
                icon={<ChevronLeft size={16} />}
                variant="outline"
                className="!scale-75"
                onClick={() => tabsNode.current?.scrollBy({ left: -200, behavior: 'smooth' })}
              />
              <Button
                icon={<ChevronRight size={16} />}
                variant="outline"
                className="!scale-75"
                onClick={() => tabsNode.current?.scrollBy({ left: 200, behavior: 'smooth' })}
              />
            </div>
          </div>

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
