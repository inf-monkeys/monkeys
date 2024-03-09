import React, { useCallback } from 'react';

import { DndContext, DragStartEvent, MouseSensor, useSensor, useSensors } from '@dnd-kit/core';
import { restrictToWindowEdges, snapCenterToCursor } from '@dnd-kit/modifiers';

import { useFlowStore } from '@/store/useFlowStore';

interface ISimplifyWrapperProps extends React.ComponentPropsWithoutRef<'div'> {}

export const SimplifyWrapper: React.FC<ISimplifyWrapperProps> = ({ children }) => {
  const { setActiveDraggableNodeId, setOverNodeId } = useFlowStore();

  const handleDragStart = useCallback(({ active }: DragStartEvent) => {
    const { id } = active;
    setActiveDraggableNodeId(id as string);
  }, []);

  const handleDragEnd = useCallback(() => {
    setActiveDraggableNodeId('');
    setOverNodeId('');
  }, []);

  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 10,
    },
  });

  const sensors = useSensors(mouseSensor);

  return (
    <DndContext
      modifiers={[restrictToWindowEdges, snapCenterToCursor]}
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragEnd}
    >
      <div className="pointer-events-auto absolute z-20 h-full">{children}</div>
    </DndContext>
  );
};
