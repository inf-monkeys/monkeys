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

import { useRoundedClass } from '@/apis/common';
import { useWorkflowAssociationList } from '@/apis/workflow/association';
import { IWorkflowAssociation } from '@/apis/workflow/association/typings';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { Separator } from '@/components/ui/separator.tsx';
import useUrlState from '@/hooks/use-url-state';
import { useFlowStore } from '@/store/useFlowStore';
import { cn } from '@/utils';

import { OperationItem } from './item';

interface IWorkbenchOperationBarProps extends React.ComponentPropsWithoutRef<'div'> {
  onDataChange?: (data: IWorkflowAssociation[]) => void;
}

export const WorkbenchOperationBar: React.FC<IWorkbenchOperationBarProps> = ({ onDataChange }) => {
  const { workflowId } = useFlowStore();

  const [{ mode }] = useUrlState<{ mode: 'normal' | 'fast' | 'mini' }>({ mode: 'normal' });

  const { roundedClass, roundedBLClass, roundedTLClass } = useRoundedClass();

  const { data: initialData } = useWorkflowAssociationList(workflowId);

  // 添加本地状态
  const [localData, setLocalData] = useState<IWorkflowAssociation[]>(initialData?.filter((it) => it.enabled) ?? []);

  // 当外部数据变化时更新本地状态
  useEffect(() => {
    setLocalData(initialData?.filter((it) => it.enabled) ?? []);
    onDataChange?.(initialData?.filter((it) => it.enabled) ?? []);
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
        'flex h-full items-center justify-center border bg-slate-1',
        mode === 'mini' ? '' : `${roundedBLClass} ${roundedTLClass} ${roundedClass} border-input`,
      )}
    >
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
              ? 'px-global-1/2 pt-global-1/2'
              : 'w-[calc(var(--operation-bar-width)+var(--global-spacing)*2)] px-global pt-global',
          )}
          ref={scrollRef}
          disabledOverflowMask
        >
          <SortableContext items={localData.map((item) => item.id)} strategy={verticalListSortingStrategy}>
            {localData.map((it) => (
              <OperationItem key={it.id} data={it}></OperationItem>
            ))}
          </SortableContext>
        </ScrollArea>
        {mode != 'mini' && <Separator orientation="vertical" />}
      </DndContext>
    </div>
  ) : (
    <></>
  );
};
