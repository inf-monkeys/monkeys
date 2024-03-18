import React, { useRef, useState } from 'react';

import { useClickOutside } from '@mantine/hooks';

import { Card } from '@/components/ui/card.tsx';
import { useVinesFlow } from '@/package/vines-flow';
import { VinesNode } from '@/package/vines-flow/core/nodes';
import { useFlowStore } from '@/store/useFlowStore';
import { CanvasStatus } from '@/store/useFlowStore/typings.ts';
import { cn } from '@/utils';
import VinesEvent from '@/utils/events.ts';

interface IComplicateNodeProps {
  node: VinesNode;
  index: number;
}

export const ComplicateNode: React.FC<IComplicateNodeProps> = ({ node, index }) => {
  const {
    id: nodeId,
    position: { x: nodeX, y: nodeY },
    size: { width, height },
  } = node;
  const { name: toolName } = node.getRaw();

  const { vines } = useVinesFlow();

  const { canvasMode, isUserInteraction, setZoomToNodeId, setIsUserInteraction } = useFlowStore();

  const mouseFocusRef = useRef(false);
  const [isNodeFocus, setIsNodeFocus] = useState(false);

  const ref = useClickOutside(() => {
    if (!mouseFocusRef.current) {
      setIsNodeFocus(false);
      // 当当前节点与用户交互的节点相同时，点击节点外部，清除用户交互状态
      void (nodeId === isUserInteraction && setIsUserInteraction(null));
    }
  });

  const handleNodeClick = () => {
    setIsUserInteraction(nodeId);
    if (isNodeFocus) return;

    setIsNodeFocus(true);
    setZoomToNodeId('complicate-' + nodeId);
    setTimeout(() => VinesEvent.emit('canvas-zoom-to-node'));

    // TODO: 激活运行时自动跟随
    // void (canvasMode === CanvasStatus.RUNNING && setAutoFollow(false));
  };

  const tool = vines.getTool(toolName);

  return (
    <div
      ref={ref}
      className={cn('relative', canvasMode === CanvasStatus.READONLY && 'pointer-events-none')}
      style={{ zIndex: 500 - (index + 1) }}
    >
      <Card
        id={'complicate-' + nodeId}
        className="absolute"
        style={{ left: nodeX, top: nodeY, width, height }}
        onClick={handleNodeClick}
        onMouseEnter={() => (mouseFocusRef.current = true)}
        onMouseLeave={() => (mouseFocusRef.current = false)}
      ></Card>
    </div>
  );
};
