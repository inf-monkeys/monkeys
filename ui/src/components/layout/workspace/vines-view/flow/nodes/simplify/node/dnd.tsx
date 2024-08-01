import React, { useEffect } from 'react';

import { DraggableSyntheticListeners, useDraggable, useDroppable } from '@dnd-kit/core';
import { motion } from 'framer-motion';

import { VinesNode } from '@/package/vines-flow/core/nodes';
import { useVinesFlow } from '@/package/vines-flow/use.ts';
import { useCanvasStore } from '@/store/useCanvasStore';
import { useCanvasInteractionStore } from '@/store/useCanvasStore/interaction.ts';
import { CanvasStatus } from '@/store/useFlowStore/typings.ts';
import { cn } from '@/utils';
import VinesEvent from '@/utils/events.ts';

interface INodeDndProps {
  node: VinesNode;
  children: (node: VinesNode, listeners: DraggableSyntheticListeners) => React.ReactNode;
  onOver?: () => void;
  onClick: () => void;
}

export const NodeDnd: React.FC<INodeDndProps> = ({ node, children, onOver, onClick }) => {
  const {
    id: nodeId,
    position: { x: nodeX, y: nodeY },
  } = node;

  const { vines } = useVinesFlow();

  const canvasMode = useCanvasStore((s) => s.canvasMode);
  const setOverNodeId = useCanvasStore((s) => s.setOverNodeId);

  const scale = useCanvasInteractionStore((s) => s.scale);
  const canvasDisabled = useCanvasInteractionStore((s) => s.canvasDisabled);

  const isEditCanvasMode = canvasMode === CanvasStatus.EDIT;
  const isNodeDisabledDroppable = nodeId.startsWith('fake_node') || nodeId === 'workflow_start';
  const isNodeUnsupported = !vines.getTool(node._task?.name ?? '');

  const disabled = !isEditCanvasMode || canvasDisabled || isNodeDisabledDroppable || isNodeUnsupported;

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: nodeId,
    disabled,
  });

  const { setNodeRef: setDroppableNodeRef, isOver } = useDroppable({
    id: nodeId,
    disabled: disabled || isDragging,
  });

  const handleContextMenu = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    e.preventDefault();
    if (canvasMode !== CanvasStatus.EDIT) return;
    VinesEvent.emit('canvas-context-menu', vines.workflowId, e, 'NODE', nodeId);
  };

  useEffect(() => {
    if (isOver) {
      setOverNodeId(nodeId);
      onOver?.();
    }
  }, [isOver]);

  const child = children(node, listeners);

  return (
    <div
      ref={setNodeRef}
      key={nodeId + '_dnd'}
      id={nodeId}
      className="draggable absolute z-30 cursor-pointer focus:outline-none"
      style={{
        top: nodeY,
        left: nodeX,
        transform: `translate3d(${(transform?.x || 0) / scale}px, ${(transform?.y || 0) / scale}px, 0)`,
        zIndex: isDragging ? 30 : 20,
      }}
      onContextMenu={handleContextMenu}
      {...attributes}
      onClick={() => !canvasDisabled && onClick()}
    >
      <div ref={setDroppableNodeRef} className="relative">
        <motion.div
          className={cn(
            isDragging
              ? 'border-offset-0 rounded-xl bg-white text-black outline outline-4 outline-vines-500'
              : '!scale-100 !opacity-100',
          )}
          variants={{
            default: {
              scale: 1,
              opacity: 1,
            },
            dragging: {
              scale: 0.55,
              opacity: 0.8,
            },
          }}
          animate={isDragging ? 'dragging' : 'default'}
        >
          {child}
        </motion.div>
      </div>
    </div>
  );
};
