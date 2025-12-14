import React, { useCallback, useEffect, useRef, useState } from 'react';

import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { AnimatePresence, motion } from 'framer-motion';
import { Maximize2Icon, Minimize2Icon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { VListHandle } from 'virtua';

import { IPinPage } from '@/apis/pages/typings.ts';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

import { IWorkbenchViewItemPage, IWorkbenchViewItemProps, ViewItem } from './item';

interface IVirtuaWorkbenchViewListProps {
  height: number | string;
  data: IPinPage[];
  currentPageId?: string;
  currentGroupId?: string;
  onChildClick?: IWorkbenchViewItemProps['onClick'];
  onReorder?: (newData: IPinPage[]) => void;
}

let timeoutId: NodeJS.Timeout;

export const VirtuaWorkbenchViewList: React.FC<IVirtuaWorkbenchViewListProps> = ({
  height,
  data: initialData,
  currentPageId,
  currentGroupId,
  onChildClick,
  onReorder,
}) => {
  const [localData, setLocalData] = useState(initialData);

  const { t } = useTranslation();

  useEffect(() => {
    setLocalData(initialData);
  }, [initialData]);

  const containerRef = useRef<HTMLDivElement>(null);
  const collapsedViewportRef = useRef<HTMLDivElement | null>(null);
  const expandedViewportRef = useRef<HTMLDivElement | null>(null);
  const syncingRef = useRef(false);
  const [expanded, setExpanded] = useState(false);
  const ref = useRef<VListHandle>(null);
  const lastPageId = useRef<string>();

  const handleChildClick = useCallback(
    (page: IWorkbenchViewItemPage) => {
      onChildClick?.(page);
      setExpanded(false);
    },
    [onChildClick],
  );

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = localData.findIndex((item) => item.id === active.id);
    const newIndex = localData.findIndex((item) => item.id === over.id);

    const newData = arrayMove(localData, oldIndex, newIndex);

    setLocalData(newData);

    onReorder?.(newData);
  };

  // 保持原有的滚动逻辑
  useEffect(() => {
    if (!currentPageId || !currentGroupId || !ref.current) return;
    if (lastPageId.current === currentPageId) return;
    lastPageId.current = currentPageId;
    const index = localData.findIndex((it) => it?.id === currentPageId);
    if (index === -1) return;
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => ref.current?.scrollToIndex(index, { smooth: true, offset: -40 }), 100);
  }, [currentGroupId, currentPageId, localData]);

  const handleScroll = useCallback(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  useEffect(() => {
    if (expanded && expandedViewportRef.current) {
      expandedViewportRef.current.scrollTop = collapsedViewportRef.current?.scrollTop ?? 0;
    }
  }, [expanded]);

  const syncScroll = (source: 'collapsed' | 'expanded') => (position: { x: number; y: number }) => {
    if (syncingRef.current) return;
    const targetRef = source === 'collapsed' ? expandedViewportRef : collapsedViewportRef;
    if (!targetRef.current) return;
    syncingRef.current = true;
    targetRef.current.scrollTop = position.y;
    syncingRef.current = false;
  };

  // 点击容器外部时收起展开态
  useEffect(() => {
    if (!expanded) return;
    const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
      const container = containerRef.current;
      if (!container) return;
      if (!container.contains(event.target as Node)) {
        setExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [expanded]);

  const expandButtonM = 'ml-[0.25rem]';

  const renderToggleButton = () => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          onClick={() => setExpanded((s) => !s)}
          icon={expanded ? <Minimize2Icon /> : <Maximize2Icon />}
          size="icon"
          variant="ghost"
          theme="black"
          aria-pressed={expanded}
        />
      </TooltipTrigger>
      <TooltipContent className="z-20">{t('workbench.sidebar.toggle')}</TooltipContent>
    </Tooltip>
  );

  return (
    <div ref={containerRef} className="relative">
      {/* 固定层 */}
      <div className="flex h-full flex-col p-global-1/2">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          onDragEnd={handleDragEnd}
        >
          <ScrollArea
            className={'w-[calc(var(--operation-bar-width))] flex-1'}
            ref={collapsedViewportRef}
            style={{ height }}
            scrollBarDisabled
            onScroll={handleScroll}
            onScrollPositionChange={syncScroll('collapsed')}
          >
            <SortableContext items={localData.map((item) => item.id)} strategy={verticalListSortingStrategy}>
              {/* <Virtualizer ref={ref} scrollRef={collapsedViewportRef}> */}
              {localData.map((it, i) => (
                <ViewItem
                  key={it.id ?? i}
                  page={it as IWorkbenchViewItemPage}
                  onClick={handleChildClick}
                  onlyShowWorkbenchIcon={true}
                />
              ))}
              {/* </Virtualizer> */}
            </SortableContext>
          </ScrollArea>
        </DndContext>
        <div className={expandButtonM}>{renderToggleButton()}</div>
      </div>

      {/* 悬浮层 */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            variants={{
              visible: { opacity: 1, width: 240 },
              hidden: { opacity: 0, width: 64 },
            }}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{
              visible: { duration: 0.2 },
              hidden: { duration: 0 },
            }}
            className="absolute left-0 top-0 z-50 h-full overflow-hidden rounded-lg border-r bg-slate-1 shadow-xl"
          >
            <div className="flex h-full flex-col p-global-1/2">
              <ScrollArea
                ref={expandedViewportRef}
                className="flex-1"
                scrollBarDisabled
                onScrollPositionChange={syncScroll('expanded')}
              >
                <div className={`flex flex-col`}>
                  {localData.map((it, i) => (
                    <motion.div key={it.id ?? i}>
                      <ViewItem
                        key={it.id ?? i}
                        page={it as IWorkbenchViewItemPage}
                        onClick={handleChildClick}
                        onlyShowWorkbenchIcon={false}
                      />
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>

              <div className={expandButtonM}>{renderToggleButton()}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
