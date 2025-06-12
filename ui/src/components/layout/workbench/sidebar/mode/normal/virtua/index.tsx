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
import { Virtualizer, VListHandle } from 'virtua';

import { IPinPage } from '@/apis/pages/typings.ts';
import {
  IWorkbenchViewItemPage,
  IWorkbenchViewItemProps,
  ViewItem,
} from '@/components/layout/workbench/sidebar/mode/normal/virtua/item.tsx';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { useOnlyShowWorkbenchIcon } from '@/store/showWorkbenchIcon';
import { cn } from '@/utils';

interface IVirtuaWorkbenchViewListProps {
  height: number;
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
  // 添加本地状态
  const [localData, setLocalData] = useState(initialData);

  // 当外部数据变化时更新本地状态
  useEffect(() => {
    setLocalData(initialData);
  }, [initialData]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const onlyShowWorkbenchIcon = useOnlyShowWorkbenchIcon();
  const ref = useRef<VListHandle>(null);
  const lastPageId = useRef<string>();

  // 添加传感器
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

  // 处理拖拽结束事件
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = localData.findIndex((item) => item.id === active.id);
    const newIndex = localData.findIndex((item) => item.id === over.id);

    const newData = arrayMove(localData, oldIndex, newIndex);

    // 更新本地状态
    setLocalData(newData);

    // 调用外部回调
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

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
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

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
      onDragEnd={handleDragEnd}
    >
      <ScrollArea
        className={cn('w-56 px-4 pt-4', onlyShowWorkbenchIcon && 'w-[4.80rem]')}
        ref={scrollRef}
        style={{ height }}
        disabledOverflowMask
        onScroll={handleScroll}
      >
        <SortableContext items={localData.map((item) => item.id)} strategy={verticalListSortingStrategy}>
          <Virtualizer ref={ref} scrollRef={scrollRef}>
            {localData.map((it, i) => (
              <ViewItem
                key={it.id ?? i}
                page={it as IWorkbenchViewItemPage}
                onClick={onChildClick}
                onlyShowWorkbenchIcon={onlyShowWorkbenchIcon}
              />
            ))}
          </Virtualizer>
        </SortableContext>
      </ScrollArea>
    </DndContext>
  );
};
