import React from 'react';

import { SimplifyNodeExpand } from '@/components/layout/vines-view/flow/nodes/simplify/expand';
import { SimplifyEndNodeExpand } from '@/components/layout/vines-view/flow/nodes/simplify/expand/end.tsx';
import { SimplifyStartNodeExpand } from '@/components/layout/vines-view/flow/nodes/simplify/expand/start.tsx';
import { NodeDnd } from '@/components/layout/vines-view/flow/nodes/simplify/node/dnd.tsx';
import { VinesEndNode } from '@/components/layout/vines-view/flow/nodes/simplify/node/endpoint/end.tsx';
import { VinesStartNode } from '@/components/layout/vines-view/flow/nodes/simplify/node/endpoint/start.tsx';
import { VinesSimpleNode } from '@/components/layout/vines-view/flow/nodes/simplify/node/simple';
import { NodeToolbar } from '@/components/layout/vines-view/flow/toolbar/node';
import { VinesNode } from '@/package/vines-flow/core/nodes';
import { IVinesFlowRenderType } from '@/package/vines-flow/core/typings.ts';
import { useVinesFlow } from '@/package/vines-flow/use.ts';
import { useCanvasStore } from '@/store/useCanvasStore';
import { useCanvasInteractionStore } from '@/store/useCanvasStore/interaction.ts';
import { CanvasStatus } from '@/store/useFlowStore/typings.ts';
import { cn } from '@/utils';
import VinesEvent from '@/utils/events.ts';

interface ISimplifyNodeProps {
  node: VinesNode;
}

export const SimplifyNode: React.FC<ISimplifyNodeProps> = ({ node }) => {
  const {
    id: nodeId,
    position: { x: nodeX, y: nodeY },
    customData,
  } = node;
  const { name: toolName } = node.getRaw();

  const { vines } = useVinesFlow();

  const canvasMode = useCanvasStore((s) => s.canvasMode);
  const canvasDisabled = useCanvasInteractionStore((s) => s.canvasDisabled);

  const handleNodeClick = () => {
    if (![CanvasStatus.EDIT, CanvasStatus.READONLY].includes(canvasMode)) return;
    if (nodeId.startsWith('fake_node') && canvasMode === CanvasStatus.EDIT) {
      VinesEvent.emit('flow-select-nodes', {
        _wid: vines.workflowId,
        targetNodeId: nodeId,
      });
      return;
    }
    if (['workflow_start', 'workflow_end'].includes(nodeId)) return;

    VinesEvent.emit('flow-tool-editor', vines.workflowId, nodeId);
  };

  const isStartNode = nodeId === 'workflow_start';
  const isEndNode = nodeId === 'workflow_end';
  const isMiniNode = vines.renderOptions.type === IVinesFlowRenderType.MINI;
  const isSimplifyHorizontal =
    vines.renderOptions.type === IVinesFlowRenderType.SIMPLIFY && vines.renderDirection === 'horizontal';

  return (
    <>
      <NodeDnd node={node} onClick={handleNodeClick}>
        {(_vinesNode, listeners) =>
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
              canvasMode={canvasMode}
              canvasDisabled={canvasDisabled}
              isMiniNode={isMiniNode}
              {...listeners}
            />
          )
        }
      </NodeDnd>
      <div
        className={cn(
          'pointer-events-none absolute flex min-h-[80px] min-w-60 items-center pl-5',
          isMiniNode && 'rounded-r-xl border border-l-0 border-input bg-white !pl-1 dark:bg-slate-3',
          isSimplifyHorizontal && '!min-w-52 scale-75 justify-center !pl-0 text-center',
        )}
        style={{ left: nodeX + (isSimplifyHorizontal ? -64 : 80), top: nodeY + (isSimplifyHorizontal ? -70 : 0) }}
      >
        {isStartNode ? (
          <SimplifyStartNodeExpand />
        ) : isEndNode ? (
          <SimplifyEndNodeExpand />
        ) : (
          <SimplifyNodeExpand nodeId={nodeId} customData={customData} toolName={toolName} />
        )}
      </div>

      {!isStartNode && !isEndNode && <NodeToolbar node={node} />}
    </>
  );
};
