import React from 'react';

import { NodeDnd } from '@/components/layout/vines-flow/nodes/simplify/node/dnd.tsx';
import { VinesEndNode } from '@/components/layout/vines-flow/nodes/simplify/node/endpoint/end.tsx';
import { VinesStartNode } from '@/components/layout/vines-flow/nodes/simplify/node/endpoint/start.tsx';
import { VinesSimpleNode } from '@/components/layout/vines-flow/nodes/simplify/node/simple';
import { VinesNode } from '@/package/vines-flow/core/nodes';
import { IVinesFlowRenderType } from '@/package/vines-flow/core/typings.ts';
import { useVinesFlow } from '@/package/vines-flow/use.ts';
import { useFlowStore } from '@/store/useFlowStore';
import { CanvasStatus } from '@/store/useFlowStore/typings.ts';
import VinesEvent from '@/utils/events';

interface ISimplifyNodeProps {
  node: VinesNode;
}

export const SimplifyNode: React.FC<ISimplifyNodeProps> = ({ node }) => {
  const {
    id: nodeId,
    position: { x: nodeX, y: nodeY },
  } = node;

  const { vines } = useVinesFlow();
  const { canvasMode, canvasDisabled } = useFlowStore();

  const handleNodeClick = () => {
    if (![CanvasStatus.EDIT, CanvasStatus.READONLY].includes(canvasMode)) return;
    if (nodeId.startsWith('fake_node') && canvasMode === CanvasStatus.EDIT) {
      VinesEvent.emit('flow-select-nodes', {
        targetNodeId: nodeId,
      });
      return;
    }
    if (['workflow_start', 'workflow_end'].includes(nodeId)) return;

    VinesEvent.emit('flow-open-node-editor', nodeId);
  };

  const isStartNode = nodeId === 'workflow_start';
  const isEndNode = nodeId === 'workflow_end';
  const isMiniNode = vines.renderOptions.type === IVinesFlowRenderType.MINI;
  const isSimplifyHorizontal =
    vines.renderOptions.type === IVinesFlowRenderType.SIMPLIFY && vines.renderDirection === 'horizontal';

  return (
    <>
      <NodeDnd node={node} onClick={handleNodeClick}>
        {(_vinesNode, isDragging, isOver, listeners) =>
          isStartNode ? (
            <VinesStartNode
              key="vines-trigger-node"
              canvasMode={canvasMode}
              canvasDisabled={canvasDisabled}
              isMiniNode={isMiniNode}
            />
          ) : isEndNode ? (
            <VinesEndNode
              key="vines-end-node"
              canvasMode={canvasMode}
              canvasDisabled={canvasDisabled}
              isMiniNode={isMiniNode}
            />
          ) : (
            <VinesSimpleNode
              node={_vinesNode}
              isDragging={isDragging}
              isOver={isOver}
              canvasMode={canvasMode}
              canvasDisabled={canvasDisabled}
              isMiniNode={isMiniNode}
              {...listeners}
            />
          )
        }
      </NodeDnd>
    </>
  );
};
