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

import { useWorkflowAssociationList } from '@/apis/workflow/association';
import { IWorkflowAssociation } from '@/apis/workflow/association/typings';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { Separator } from '@/components/ui/separator.tsx';
import { useFlowStore } from '@/store/useFlowStore';
import { cn } from '@/utils';

import { OperationItem } from './item';

interface IWorkbenchOperationBarProps extends React.ComponentPropsWithoutRef<'div'> { }

export const WorkbenchOperationBar: React.FC<IWorkbenchOperationBarProps> = ({ }) => {
  // const initialData: IWorkflowAssociation[] = [
  //   {
  //     enabled: true,
  //     id: 'demo',
  //     displayName: {
  //       'zh-CN': '测试',
  //       'en-US': 'demo',
  //     },
  //     originWorkflowId: '684a51c172d6c876c7222113',
  //     targetWorkflowId: '684a51c73ae01ac36bb92313',
  //     mapper: [
  //       {
  //         origin: '__value',
  //         target: 'ntdwzd',
  //         default: 'demo',
  //       },
  //     ],
  //     uuid: '1',
  //     createdTimestamp: 1,
  //     updatedTimestamp: 1,
  //     isDeleted: false,
  //   },
  // ];

  const { workflowId } = useFlowStore();

  const { data: initialData } = useWorkflowAssociationList(workflowId);

  // 添加本地状态
  const [localData, setLocalData] = useState<IWorkflowAssociation[]>(initialData ?? []);

  // 当外部数据变化时更新本地状态
  useEffect(() => {
    setLocalData(initialData ?? []);
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
    <div className={cn('flex h-full items-center justify-center rounded-xl border border-input bg-slate-1 shadow-sm')}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis]}
        onDragEnd={handleDragEnd}
      >
        <ScrollArea className={cn('h-full w-[4.8rem] px-4 pt-4')} ref={scrollRef} disabledOverflowMask>
          <SortableContext items={localData.map((item) => item.id)} strategy={verticalListSortingStrategy}>
            {localData.map((it) => (
              <OperationItem key={it.id} data={it}></OperationItem>
            ))}
          </SortableContext>
        </ScrollArea>
        <Separator orientation="vertical" />
      </DndContext>
    </div>
  ) : (
    <></>
  );
};
