import React, { useRef, useState } from 'react';

import { useClickOutside } from '@mantine/hooks';
import { CircularProgress } from '@nextui-org/progress';
import { motion } from 'framer-motion';

import { ComplicateFakeNode } from '@/components/layout/vines-flow/nodes/complicate/node/endpoint/fake.tsx';
import { ComplicateEndNode } from '@/components/layout/vines-flow/nodes/complicate/node/endpoint/output.tsx';
import { ComplicateTriggerNode } from '@/components/layout/vines-flow/nodes/complicate/node/endpoint/trigger.tsx';
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
    customData,
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
  const isStartNode = nodeId === 'workflow_start';
  const isEndNode = nodeId === 'workflow_end';
  const isFakeNode = nodeId.startsWith('fake_node');
  const isSimpleNode = !isStartNode && !isEndNode && !isFakeNode;

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
      >
        {!tool && isSimpleNode ? (
          <motion.div
            className="flex h-full w-full items-center justify-center"
            key={'vines-complicate-loading-' + nodeId}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <CircularProgress className="[&_circle:last-child]:stroke-vines-500" size="lg" aria-label="Loading..." />
          </motion.div>
        ) : (
          <>
            <motion.div
              className="h-full w-full overflow-clip"
              key={'vines-complicate-' + nodeId}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {isStartNode ? (
                <ComplicateTriggerNode key="vines-complicate-trigger" />
              ) : isEndNode ? (
                <ComplicateEndNode key="vines-complicate-end-node" />
              ) : isFakeNode ? (
                <ComplicateFakeNode insertFromNodeId={nodeId} />
              ) : (
                <div key={'vines-complicate-' + nodeId} />
              )}
            </motion.div>
            {isSimpleNode && <div />}
          </>
        )}
      </Card>
    </div>
  );
};
