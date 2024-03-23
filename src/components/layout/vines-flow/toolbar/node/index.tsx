import React, { useCallback, useEffect, useRef } from 'react';

import { motion } from 'framer-motion';
import { ArrowDownToLine, ArrowUpToLine } from 'lucide-react';

import { ToolDroppable } from '@/components/layout/vines-flow/toolbar/node/item.tsx';
import { VinesNode } from '@/package/vines-flow/core/nodes';
import { useVinesFlow } from '@/package/vines-flow/use.ts';
import { useFlowStore } from '@/store/useFlowStore';
import { cn } from '@/utils';

interface INodeToolbarProps {
  node: VinesNode;
}

export const NodeToolbar: React.FC<INodeToolbarProps> = ({ node }) => {
  const {
    id,
    position: { x: left, y: top },
  } = node;

  const { vines } = useVinesFlow();
  const { overNodeId, activeDraggableNodeId } = useFlowStore();

  const visible = overNodeId === id && activeDraggableNodeId !== overNodeId;

  const operationNodeIdRef = useRef<{ over: string; draggable: string }>({ over: '', draggable: '' });

  const activeDraggableNodeIdRef = useRef<string>('');

  useEffect(() => {
    activeDraggableNodeId && (activeDraggableNodeIdRef.current = activeDraggableNodeId);
  }, [activeDraggableNodeId]);

  useEffect(() => {
    if (visible) {
      operationNodeIdRef.current = {
        over: overNodeId,
        draggable: activeDraggableNodeId,
      };
    }
  }, [overNodeId]);

  const onOver = useCallback(
    async (_isOver: boolean, dId: string) => {
      if (!visible && activeDraggableNodeIdRef.current) {
        const { over: overNodeId, draggable: draggableNodeId } = operationNodeIdRef.current;
        if (dId === 'insertAfter') {
          vines.move(draggableNodeId, overNodeId, true);
        } else if (dId === 'insertBefore') {
          vines.move(draggableNodeId, overNodeId, false);
        }

        activeDraggableNodeIdRef.current = '';
      }
    },
    [visible, vines],
  );

  return (
    <motion.div
      className={cn(
        'absolute z-20 flex w-16 flex-col items-start gap-2 rounded-md bg-card p-2 shadow-md transition-all',
        !visible && '!opacity-0',
      )}
      variants={{
        hide: {
          opacity: 0,
          scale: 0.9,
        },
        show: {
          opacity: 1,
          scale: 1,
        },
      }}
      style={{ minHeight: 80, left: left - 80, top }}
      animate={visible ? 'show' : 'hide'}
    >
      <ToolDroppable id="insertAfter" nodeId={id} visible={visible} onOver={onOver}>
        <ArrowUpToLine />
        <span className="text-xxs">向上插入</span>
      </ToolDroppable>
      <ToolDroppable id="insertBefore" nodeId={id} visible={visible} onOver={onOver}>
        <ArrowDownToLine />
        <span className="text-xxs">向下插入</span>
      </ToolDroppable>
    </motion.div>
  );
};
