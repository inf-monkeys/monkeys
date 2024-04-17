import React, { useCallback, useState } from 'react';

import { DragStartEvent, useDndMonitor } from '@dnd-kit/core';

import { VinesNode } from '@/package/vines-flow/core/nodes';

interface INodeDragOverlayProps {
  nodes: VinesNode[];
  children: (node: VinesNode) => React.ReactNode;
}

export const NodeDragOverlay: React.FC<INodeDragOverlayProps> = ({ nodes, children }) => {
  const [currentDraggedNode, setCurrentDraggedNode] = useState<VinesNode | null>(null);

  const onDragStart = useCallback(
    (e: DragStartEvent) => {
      const { id } = e.active;
      const node = nodes.find((it) => it.id === id);
      if (!node) return;
      setCurrentDraggedNode(node);
    },
    [nodes],
  );

  useDndMonitor({
    onDragStart,
    onDragEnd: () => setCurrentDraggedNode(null),
  });

  if (!currentDraggedNode) return null;

  return (
    <div className="absolute z-10" style={{ left: currentDraggedNode.position.x, top: currentDraggedNode.position.y }}>
      <div className="flex h-full select-none items-center gap-5">{children(currentDraggedNode)}</div>
    </div>
  );
};
