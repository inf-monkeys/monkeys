import React, { useEffect, useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';

import { VinesEdgePath } from '@/package/vines-flow/core/nodes/typings.ts';
import { useVinesFlow } from '@/package/vines-flow/use.ts';

export const VinesEdges: React.FC = () => {
  const { vines, VINES_REFRESHER } = useVinesFlow();

  const genEdgePath = (structure: [string, VinesEdgePath]) => {
    const [id, edgeStructure] = structure;
    const path = edgeStructure.map(({ type, axis }) => {
      const coordinate = axis.map((item) => item.join(',')).join(' ');
      return `${type} ${coordinate}`;
    });
    return [id, path.join(' ')];
  };

  const [edges, setEdges] = useState<[string, VinesEdgePath][]>([]);
  const [visible, setVisible] = useState(false);
  const [edgeStagger, setEdgeStagger] = useState(0.2);

  useEffect(() => {
    const edges = vines.svg();
    const edgeLength = edges.length;

    if (!edgeLength) return;
    setEdges(edges);

    setEdgeStagger(edgeLength * 0.12 > 2 ? 2 / edgeLength : 0.12);
    setTimeout(() => setVisible(edgeLength > 0), 100);
  }, [VINES_REFRESHER]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.svg
          fill="none"
          key="vines-edges"
          className="absolute size-full stroke-[4]"
          style={{ strokeLinecap: 'round' }}
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: edgeStagger,
              },
            },
            exit: {
              opacity: 0,
            },
          }}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {edges.map((edgePath, index) => {
            const [id, path] = genEdgePath(edgePath);
            return (
              <motion.g
                key={index}
                data-id={id}
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                  },
                  exit: {
                    opacity: 0,
                  },
                }}
              >
                <path d={path} className="stroke-gray-6 dark:stroke-gold-12" />

                <motion.path
                  key={index + '-vines-edge-path'}
                  d={path}
                  transition={{ duration: 0.25 }}
                  exit={{
                    opacity: 0,
                    pathLength: 0,
                  }}
                />
              </motion.g>
            );
          })}
        </motion.svg>
      )}
    </AnimatePresence>
  );
};
