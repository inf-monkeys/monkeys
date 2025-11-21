import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';

import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  UniqueIdentifier,
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

import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { Separator } from '@/components/ui/separator.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/utils';

import { OperationBarTipButton } from '../operation-bar/tip-button';
import { IconButton } from './icon-button';

export interface CommonOperationBarItemShape {
  id: UniqueIdentifier;
}

export interface CommonOperationBarProps<T extends CommonOperationBarItemShape>
  extends React.ComponentPropsWithoutRef<'div'> {
  data: T[];
  mode: 'normal' | 'fast' | 'mini';
  density?: 'compact' | 'default';
  themeMode?: 'border' | 'shadow';
  renderItem: (item: T, restProps: { expanded: boolean }) => React.ReactNode;
  tipButtonProps: React.ComponentProps<typeof OperationBarTipButton>;
  onReorder?: (data: T[], activeId: UniqueIdentifier, overId: UniqueIdentifier) => void;
  showSeparatorInMini?: boolean;
  scrollAreaClassName?: string;
}

export const CommonOperationBar = <T extends CommonOperationBarItemShape>({
  data,
  mode,
  density = 'default',
  themeMode = 'border',
  renderItem,
  tipButtonProps,
  onReorder,
  className,
  showSeparatorInMini = true,
  scrollAreaClassName,
  ...rest
}: CommonOperationBarProps<T>) => {
  const [localData, setLocalData] = useState<T[]>(data);

  const { t } = useTranslation();

  useEffect(() => {
    setLocalData(data);
  }, [data]);

  const containerRef = useRef<HTMLDivElement>(null);
  const collapsedViewportRef = useRef<HTMLDivElement>(null);
  const expandedViewportRef = useRef<HTMLDivElement | null>(null);
  const syncingRef = useRef(false);
  const [expanded, setExpanded] = useState(false);

  useLayoutEffect(() => {
    if (expanded && expandedViewportRef.current) {
      expandedViewportRef.current.scrollTop = collapsedViewportRef.current?.scrollTop ?? 0;
    } else if (!expanded && collapsedViewportRef.current) {
      collapsedViewportRef.current.scrollTop = expandedViewportRef.current?.scrollTop ?? 0;
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

  const extraButtonClassName = 'm-global-1/2';

  const isCompact = density === 'compact';

  const ToggleButton = (
    <Tooltip>
      <TooltipTrigger>
        <IconButton mode={mode} isCompact={isCompact} onClick={() => setExpanded((s) => !s)}>
          {expanded ? <Minimize2Icon size={20} /> : <Maximize2Icon size={20} />}
        </IconButton>
      </TooltipTrigger>
      <TooltipContent className="z-20">{t('workbench.sidebar.toggle')}</TooltipContent>
    </Tooltip>
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
    onReorder?.(newData, active.id, over.id);
  };

  if (!localData.length) {
    return null;
  }

  const containerClassName = cn(
    'flex flex-col bg-slate-1 h-full',
    mode === 'mini' ? '' : 'rounded-lg',
    themeMode === 'border' && 'border border-input',
    themeMode === 'shadow' && 'shadow-around',
    className,
  );

  const scrollAreaWidthClass =
    mode === 'mini'
      ? 'px-global-1/2'
      : density === 'compact'
        ? 'w-[calc(var(--operation-bar-width)+var(--global-spacing))] px-global-1/2'
        : 'w-[calc(var(--operation-bar-width)+var(--global-spacing)*2)] px-global';

  const scrollAreaCls = cn('h-full', scrollAreaClassName);

  return (
    <div className={containerClassName} {...rest}>
      <div ref={containerRef} className="relative flex min-h-0 flex-1 flex-col">
        {/* 固定层 */}
        <div className="flex min-h-0 flex-1 flex-col items-end">
          <OperationBarTipButton className={extraButtonClassName} {...tipButtonProps} />
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
          >
            <ScrollArea
              className={cn(scrollAreaCls, scrollAreaWidthClass, 'flex-1', 'min-h-0')}
              ref={collapsedViewportRef}
              disabledOverflowMask
              onScrollPositionChange={syncScroll('collapsed')}
            >
              <SortableContext items={localData.map((item) => item.id)} strategy={verticalListSortingStrategy}>
                {localData.map((item) => (
                  <React.Fragment key={item.id as React.Key}>{renderItem(item, { expanded })}</React.Fragment>
                ))}
              </SortableContext>
            </ScrollArea>
            {mode === 'mini' && showSeparatorInMini && <Separator orientation="vertical" />}
          </DndContext>
          <div className={extraButtonClassName}>{ToggleButton}</div>
        </div>

        {/* 悬浮层 */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, width: 60 }}
              animate={{ opacity: 1, width: 240 }}
              exit={{ opacity: 0, width: 60 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 top-0 z-50 h-full overflow-hidden rounded-lg border-l bg-slate-1 shadow-xl"
            >
              <div className="flex h-full flex-col items-end">
                <OperationBarTipButton className={extraButtonClassName} {...tipButtonProps} />

                <ScrollArea
                  ref={expandedViewportRef}
                  className={cn(scrollAreaCls, 'flex-1', 'min-h-0')}
                  scrollBarDisabled={false}
                  onScrollPositionChange={syncScroll('expanded')}
                >
                  <div className="items-between flex flex-col">
                    {localData.map((item, i) => (
                      <motion.div key={item.id ?? i}>
                        <React.Fragment key={item.id as React.Key}>{renderItem(item, { expanded })}</React.Fragment>
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
                <div className={extraButtonClassName}>{ToggleButton}</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
