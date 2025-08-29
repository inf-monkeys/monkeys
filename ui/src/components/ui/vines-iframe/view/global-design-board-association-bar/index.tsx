import React, { useEffect, useRef, useState } from 'react';

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
import { get } from 'lodash';

import { useSystemConfig } from '@/apis/common';
import { ISystemConfig } from '@/apis/common/typings';
import { useGetDesignAssociationList } from '@/apis/designs/index.ts';
import { IDesignAssociation } from '@/apis/designs/typings';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { Separator } from '@/components/ui/separator.tsx';
import useUrlState from '@/hooks/use-url-state';
import { cn } from '@/utils';

import { OperationBarTipButton } from '../operation-bar/tip-button';
import { GlobalDesignBoardAssociationBarItem } from './item';

interface IGlobalDesignBoardAssociationBarProps extends React.ComponentPropsWithoutRef<'div'> {}

export const GlobalDesignBoardAssociationBar: React.FC<IGlobalDesignBoardAssociationBarProps> = () => {
  const [{ mode }] = useUrlState<{
    mode: 'normal' | 'fast' | 'mini';
  }>({ mode: 'normal' });

  const { data: oem } = useSystemConfig();

  const density = oem?.theme.density ?? 'default';

  const themeMode = get(oem, 'theme.themeMode', 'border') as ISystemConfig['theme']['themeMode'];

  const { data: initialData } = useGetDesignAssociationList();

  // 添加本地状态
  const [localData, setLocalData] = useState<IDesignAssociation[]>(initialData?.filter((it) => it.enabled) ?? []);

  // 当外部数据变化时更新本地状态
  useEffect(() => {
    setLocalData(initialData?.filter((it) => it.enabled) ?? []);
  }, [initialData]);

  const scrollRef = useRef<HTMLDivElement>(null);

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

  // 修改拖拽结束事件处理
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = localData.findIndex((item) => item.id === active.id);
    const newIndex = localData.findIndex((item) => item.id === over.id);

    const newData = arrayMove(localData, oldIndex, newIndex);

    // 更新本地状态
    setLocalData(newData);

    // 调用外部回调
    // onReorder?.(newData);
  };

  return localData.length > 0 ? (
    <div
      className={cn(
        'flex flex-col bg-slate-1',
        mode === 'mini' ? '' : 'rounded-lg',
        themeMode === 'border' && 'border border-input',
        themeMode === 'shadow' && 'shadow-around',
      )}
    >
      <OperationBarTipButton mode={mode} type="global-design-board" density={density} />
      <div className="flex h-full items-center justify-center">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          onDragEnd={handleDragEnd}
        >
          <ScrollArea
            className={cn(
              'h-full',
              mode === 'mini'
                ? 'px-global-1/2'
                : density === 'compact'
                  ? 'w-[calc(var(--operation-bar-width)+var(--global-spacing))] px-global-1/2'
                  : 'w-[calc(var(--operation-bar-width)+var(--global-spacing)*2)] px-global',
            )}
            ref={scrollRef}
            disabledOverflowMask
          >
            <SortableContext items={localData.map((item) => item.id)} strategy={verticalListSortingStrategy}>
              {localData.map((it) => (
                <GlobalDesignBoardAssociationBarItem key={it.id} data={it} />
              ))}
            </SortableContext>
          </ScrollArea>
          {mode != 'mini' && <Separator orientation="vertical" />}
        </DndContext>
      </div>
    </div>
  ) : (
    <></>
  );
};
