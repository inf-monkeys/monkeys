import React, { useEffect, useRef, useState } from 'react';

import { ChevronLeft, ChevronRight, Inbox, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { ToolLists } from '@/components/layout/workspace/vines-view/flow/headless-modal/tools-selector/list.tsx';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.tsx';
import { VinesToolDef, VinesToolWithCategory } from '@/package/vines-flow/core/tools/typings.ts';
import { IVinesFlowRenderType } from '@/package/vines-flow/core/typings.ts';
import { useVinesFlow } from '@/package/vines-flow/use.ts';
import { useFlowStore } from '@/store/useFlowStore';
import VinesEvent from '@/utils/events.ts';

interface IToolsSelectorProps extends React.ComponentPropsWithoutRef<'div'> {}

export const ToolsSelector: React.FC<IToolsSelectorProps> = () => {
  const { t } = useTranslation();

  const workflowId = useFlowStore((s) => s.workflowId);

  const { vines } = useVinesFlow();

  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const [targetNodeId, setTargetNodeId] = useState<string>('');
  const [disabledSelector, setDisabledSelector] = useState(false);
  const [isInsertBefore, setIsInsertBefore] = useState(false);

  useEffect(() => {
    const handleOpen = ({ _wid, targetNodeId: targetId, disabled = false, insertBefore = false }) => {
      if (workflowId !== _wid) return;

      setOpen(true);
      setSearchValue('');
      setTargetNodeId(targetId);
      setDisabledSelector(disabled);
      setIsInsertBefore(insertBefore);
    };
    VinesEvent.on('flow-select-nodes', handleOpen);
    return () => {
      VinesEvent.off('flow-select-nodes', handleOpen);
    };
  }, [workflowId]);

  const isComplicate = vines.renderOptions.type === IVinesFlowRenderType.COMPLICATE;
  const handleOnClick = (tool: VinesToolDef) => {
    if (disabledSelector) return;
    setOpen(false);

    const node = vines.createNode(tool);
    if (!node) {
      toast.error(t('workspace.flow-view.headless-modal.tool-selector.create-failed'));
      return;
    }

    const finalTargetNodeId = targetNodeId || (vines.getAllNodes()?.at(-1)?.id ?? '');
    vines.insertNode(finalTargetNodeId, node, isInsertBefore ?? false);

    setTimeout(
      () =>
        VinesEvent.emit(
          'canvas-zoom-to-node',
          (isComplicate ? 'complicate-' : '') + (Array.isArray(node) ? node[0].id : node.id),
        ),
      750,
    );
  };

  const list = vines
    .getToolsByCategory(searchValue)
    .map(([tools, ...it]) => [
      tools.filter(({ name }) => !name.endsWith(workflowId)),
      ...it,
    ]) as VinesToolWithCategory[];

  const [activeTab, setActiveTab] = useState('all');

  const listLength = list.length;
  useEffect(() => {
    if (searchValue) {
      setActiveTab(list?.[0]?.[2] ?? 'all');
    } else if (!listLength) {
      setActiveTab('all');
    }
  }, [list]);

  const tabsNode = useRef<HTMLDivElement>(null);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-[50rem]">
        <DialogTitle>{t('workspace.flow-view.headless-modal.tool-selector.title')}</DialogTitle>
        <div className="relative flex w-full items-center">
          <Search className="absolute ml-3 size-4 shrink-0 opacity-50" />
          <Input
            className="pl-9"
            placeholder={t('workspace.flow-view.headless-modal.tool-selector.placeholder')}
            onChange={setSearchValue}
          />
        </div>
        <Tabs className="h-[31.125rem]" defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <div className="flex justify-between">
            <div ref={tabsNode} className="max-w-[690px] overflow-x-hidden overflow-y-clip pr-2">
              <TabsList>
                {list.map(([, , categoryKey, category], index) => (
                  <TabsTrigger value={categoryKey} key={index}>
                    {t(`workspace.flow-view.headless-modal.tool-selector.category.${category}`)}
                  </TabsTrigger>
                ))}
                {!listLength && (
                  <TabsTrigger value="all">
                    {t(`workspace.flow-view.headless-modal.tool-selector.category.all`)}
                  </TabsTrigger>
                )}
              </TabsList>
            </div>
            <div className="relative flex items-center">
              <div className="pointer-events-none absolute -left-4 h-full w-10 bg-gradient-to-l from-background from-60%" />
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
          {!listLength && (
            <TabsContent value="all">
              <div className="vines-center h-[28.125rem] flex-col gap-2">
                <Inbox size={58} />
                <p className="text-sm">{t('common.load.empty')}</p>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
