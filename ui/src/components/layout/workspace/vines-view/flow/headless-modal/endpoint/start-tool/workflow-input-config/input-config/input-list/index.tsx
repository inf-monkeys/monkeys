import React, { useEffect, useState } from 'react';

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
import { ToolPropertyTypes } from '@inf-monkeys/monkeys/src/types/tool.ts';
import { useTranslation } from 'react-i18next';

import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { VinesWorkflowVariable } from '@/package/vines-flow/core/tools/typings.ts';

import { InputItem } from './item';

interface IWorkflowInputListProps {
  inputs: VinesWorkflowVariable[];
  children?: (variableId: string, specialType?: ToolPropertyTypes) => React.ReactNode;
  className?: string;
  cardClassName?: string;
  contentWidth?: number;
  defaultValueText?: string;
  disabledTypeTag?: boolean;
  onReorder?: (newData: VinesWorkflowVariable[]) => void;
}

export const WorkflowInputList: React.FC<IWorkflowInputListProps> = ({
  inputs,
  defaultValueText = 'Default Value',
  children,
  className,
  cardClassName,
  contentWidth,
  disabledTypeTag = false,
  onReorder,
}) => {
  const { t } = useTranslation();

  const inputLength = inputs.length;
  const inputLastIndex = inputLength - 1;

  const [localData, setLocalData] = useState<VinesWorkflowVariable[]>(inputs);

  useEffect(() => {
    setLocalData(inputs);
  }, [inputs]);

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

    const oldIndex = localData.findIndex((item) => item.name === active.id);
    const newIndex = localData.findIndex((item) => item.name === over.id);

    const newData = arrayMove(localData, oldIndex, newIndex);

    // 更新本地状态
    setLocalData(newData);

    // 调用外部回调
    onReorder?.(newData);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
      onDragEnd={handleDragEnd}
    >
      <ScrollArea className={className} disabledOverflowMask>
        <SortableContext items={localData.map((item) => item.name)} strategy={verticalListSortingStrategy}>
          {inputs.map((it, index) => {
            return (
              <InputItem
                key={it.name}
                cardClassName={cardClassName}
                contentWidth={contentWidth}
                defaultValueText={defaultValueText}
                disabledTypeTag={disabledTypeTag}
                index={index}
                inputLastIndex={inputLastIndex}
                inputLength={inputLength}
                it={it}
              >
                {children}
              </InputItem>
            );
          })}
        </SortableContext>
      </ScrollArea>
    </DndContext>
  );
};
