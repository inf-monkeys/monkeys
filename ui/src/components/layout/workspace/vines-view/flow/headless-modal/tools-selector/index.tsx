import React, { useCallback, useEffect, useRef, useState } from 'react';

import { get } from 'lodash';
import { ChevronLeft, ChevronRight, Inbox, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useSystemConfig } from '@/apis/common';
import { ToolLists } from '@/components/layout/workspace/vines-view/flow/headless-modal/tools-selector/list.tsx';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toolSearchService } from '@/package/vines-flow/core/tools/search-utils.ts';
import { VinesToolDef, VinesToolWithCategory } from '@/package/vines-flow/core/tools/typings.ts';
import { IVinesFlowRenderType } from '@/package/vines-flow/core/typings.ts';
import { useVinesFlow } from '@/package/vines-flow/use.ts';
import { useFlowStore } from '@/store/useFlowStore';
import VinesEvent from '@/utils/events.ts';

interface IToolsSelectorProps extends React.ComponentPropsWithoutRef<'div'> {}

export const ToolsSelector: React.FC<IToolsSelectorProps> = () => {
  const { t } = useTranslation();

  const { data: oem } = useSystemConfig();
  const oemId = get(oem, ['theme', 'id'], undefined);

  const workflowId = useFlowStore((s) => s.workflowId);

  const { vines } = useVinesFlow();

  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [targetNodeId, setTargetNodeId] = useState<string>('');
  const [disabledSelector, setDisabledSelector] = useState(false);
  const [isInsertBefore, setIsInsertBefore] = useState(false);

  useEffect(() => {
    const handleOpen = ({ _wid, targetNodeId: targetId, disabled = false, insertBefore = false }) => {
      if (workflowId !== _wid) return;

      setOpen(true);
      setSearchValue('');
      setSuggestions([]);
      setShowSuggestions(false);
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

  // 处理搜索建议
  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value);

    if (value?.trim()) {
      const newSuggestions = toolSearchService.getSuggestions(value, 5);
      setSuggestions(newSuggestions);
      setShowSuggestions(newSuggestions.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, []);

  const handleSuggestionClick = useCallback((suggestion: string) => {
    setSearchValue(suggestion);
    setShowSuggestions(false);
  }, []);

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
      <DialogContent className="max-w-[51.6rem]">
        <DialogTitle>{t('workspace.flow-view.headless-modal.tool-selector.title')}</DialogTitle>
        <div className="relative w-full">
          <div className="relative flex w-full items-center [&>div]:w-full">
            <Search className="absolute ml-3 size-4 shrink-0 opacity-50" />
            <Input
              className="pl-[calc(var(--global-spacing)+1rem)]"
              placeholder={t('workspace.flow-view.headless-modal.tool-selector.placeholder')}
              value={searchValue}
              onChange={handleSearchChange}
              onFocus={() => {
                if (searchValue.trim() && suggestions.length > 0) {
                  setShowSuggestions(true);
                }
              }}
            />
          </div>

          {/* 搜索建议下拉框 */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="cursor-pointer px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </div>
              ))}
            </div>
          )}
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

          {list.map(([list, length, category], index) => {
            if (oemId === 'concept-design' && category === 'all') {
              list = list.sort((a, b) => {
                const aIsConcept = a.namespace === 'monkeys_tool_concept_design' ? 0 : 1;
                const bIsConcept = b.namespace === 'monkeys_tool_concept_design' ? 0 : 1;
                return aIsConcept - bIsConcept;
              });
            }
            return (
              <TabsContent value={category} key={index}>
                <ToolLists list={list} length={length} category={category} onClick={handleOnClick} />
              </TabsContent>
            );
          })}
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
