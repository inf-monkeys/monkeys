import React from 'react';

import { AnimatePresence, motion } from 'framer-motion';

import { NodeDragOverlay } from '@/components/layout/vines-flow/nodes/simplify/drag-overlay.tsx';
import { SimplifyNode } from '@/components/layout/vines-flow/nodes/simplify/node';
import { VinesSimpleNode } from '@/components/layout/vines-flow/nodes/simplify/node/simple';
import { SimplifyWrapper } from '@/components/layout/vines-flow/nodes/simplify/wrapper.tsx';
import { VinesNode } from '@/package/vines-flow/core/nodes';

interface ISimplifyNodesProps {
  visible: boolean;
  nodes: VinesNode[];
  nodeStagger: number;
}

export const SimplifyNodes: React.FC<ISimplifyNodesProps> = ({ visible, nodes, nodeStagger }) => {
  return (
    <SimplifyWrapper>
      <AnimatePresence>
        {visible && (
          <motion.div
            key="vines-nodes-wrapper"
            variants={{
              hidden: { opacity: 1, transition: { duration: 0.1 } },
              visible: { opacity: 1, transition: { duration: 0.1, staggerChildren: nodeStagger } },
            }}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            {nodes.map((node, index) => (
              <motion.div key={index} variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}>
                <SimplifyNode node={node} />
                <NodeDragOverlay nodes={nodes}>{(_node) => <VinesSimpleNode node={_node} />}</NodeDragOverlay>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </SimplifyWrapper>
  );
};
