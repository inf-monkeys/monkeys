import React from 'react';

import { AnimatePresence, motion } from 'framer-motion';

import { ComplicateNode } from '@/components/layout/workspace/vines-view/flow/nodes/complicate/node';
import { VinesNode } from '@/package/vines-flow/core/nodes';

interface IComplicateNodesProps {
  visible: boolean;
  nodes: VinesNode[];
  nodeStagger: number;
}

export const ComplicateNodes: React.FC<IComplicateNodesProps> = ({ visible, nodes, nodeStagger }) => {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="vines-complicate-nodes-wrapper"
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
              <ComplicateNode node={node} index={index} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
