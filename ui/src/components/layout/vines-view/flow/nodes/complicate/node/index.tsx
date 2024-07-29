import React, { useRef, useState } from 'react';

import { useClickAway } from 'ahooks';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { ComplicateSimpleNodeExpand } from 'src/components/layout/vines-view/flow/nodes/complicate/node/simple/expand';

import { ComplicateFakeNode } from '@/components/layout/vines-view/flow/nodes/complicate/node/endpoint/fake.tsx';
import { ComplicateEndNode } from '@/components/layout/vines-view/flow/nodes/complicate/node/endpoint/output.tsx';
import { ComplicateTriggerNode } from '@/components/layout/vines-view/flow/nodes/complicate/node/endpoint/start/trigger.tsx';
import { ComplicateSimpleNode } from '@/components/layout/vines-view/flow/nodes/complicate/node/simple';
import { Card } from '@/components/ui/card.tsx';
import { VinesLoading } from '@/components/ui/loading';
import { useVinesFlow } from '@/package/vines-flow';
import { VinesNode } from '@/package/vines-flow/core/nodes';
import { VinesTask } from '@/package/vines-flow/core/nodes/typings.ts';
import { VINES_STATUS } from '@/package/vines-flow/core/typings.ts';
import { useCanvasStore } from '@/store/useCanvasStore';
import { useCanvasInteractionStore } from '@/store/useCanvasStore/interaction.ts';
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
    executionTask,
    executionStatus,
  } = node;
  const { name: toolName } = node.getRaw();

  const { vines } = useVinesFlow();

  const canvasMode = useCanvasStore((s) => s.canvasMode);
  const isWorkflowRUNNING = useCanvasStore((s) => s.isWorkflowRUNNING);

  const isUserInteraction = useCanvasInteractionStore((s) => s.isUserInteraction);
  const setIsUserInteraction = useCanvasInteractionStore((s) => s.setIsUserInteraction);

  const mouseFocusRef = useRef(false);
  const [isNodeFocus, setIsNodeFocus] = useState(false);

  const ref = useRef<HTMLDivElement | null>(null);
  useClickAway(() => {
    if (!mouseFocusRef.current) {
      setIsNodeFocus(false);
      // 当当前节点与用户交互的节点相同时，点击节点外部，清除用户交互状态
      void (nodeId === isUserInteraction && setIsUserInteraction(null));
    }
  }, ref);

  const handleNodeClick = () => {
    setIsUserInteraction(nodeId);
    if (isNodeFocus) return;

    setIsNodeFocus(true);
    setTimeout(() => VinesEvent.emit('canvas-zoom-to-node', 'complicate-' + nodeId));

    // TODO: 激活运行时自动跟随
    // void (canvasMode === CanvasStatus.RUNNING && setAutoFollow(false));
  };

  const handleRawUpdate = (data: string) => {
    try {
      const task = JSON.parse(data);
      if (node) {
        vines.updateRaw(nodeId, task, false);
      } else {
        toast.error('Tool not found!');
      }
    } catch {
      /* empty */
    }
  };

  const tool = vines.getTool(toolName);
  const isStartNode = nodeId === 'workflow_start';
  const isEndNode = nodeId === 'workflow_end';
  const isFakeNode = nodeId.startsWith('fake_node');
  const isSimpleNode = !isStartNode && !isEndNode && !isFakeNode;

  const variableMapper = Object.fromEntries(vines.variablesMapper.entries());
  const nodeExecutionStatus = executionTask?.originStatus ?? executionStatus;

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
        {vines.status === VINES_STATUS.IDLE && isSimpleNode ? (
          <motion.div
            className="flex h-full w-full items-center justify-center"
            key={'vines-complicate-loading-' + nodeId}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <VinesLoading />
          </motion.div>
        ) : (
          <>
            <motion.div
              className="h-full w-full overflow-hidden"
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
                <ComplicateSimpleNode
                  key={'vines-complicate-' + nodeId}
                  workflowId={vines.workflowId ?? ''}
                  task={node.getRaw()}
                  nodeId={nodeId}
                  tool={tool}
                  toolName={toolName}
                  customData={customData}
                  variableMapper={variableMapper}
                  onSaved={() => vines.emit('update', vines.getRaw())}
                  onRawUpdate={handleRawUpdate}
                  vinesUpdateRaw={(nodeId: string, task: VinesTask, update: boolean) =>
                    vines.updateRaw(nodeId, task, update)
                  }
                  workflowStatus={vines.executionStatus}
                  status={nodeExecutionStatus}
                />
              )}
            </motion.div>
            {isSimpleNode && (
              <ComplicateSimpleNodeExpand
                nodeId={nodeId}
                visible={isNodeFocus}
                executionTask={executionTask}
                isWorkflowRUNNING={isWorkflowRUNNING}
              />
            )}
          </>
        )}
      </Card>
    </div>
  );
};
