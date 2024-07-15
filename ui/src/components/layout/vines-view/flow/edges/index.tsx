import React, { memo, useCallback, useEffect, useRef, useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';

import { VinesEdgePath } from '@/package/vines-flow/core/nodes/typings.ts';
import { useVinesFlow } from '@/package/vines-flow/use.ts';
import { useRetimer } from '@/utils/use-retimer.ts';

export const VinesEdges: React.FC = memo(() => {
  const { vines, VINES_REFRESHER } = useVinesFlow();

  const reTimer = useRetimer();

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

  const edgesLengthRef = useRef(0);

  const handleUpdate = useCallback(
    (edges: [string, VinesEdgePath][], length: number) => {
      reTimer(
        setTimeout(() => {
          edgesLengthRef.current = length;
          if (!length) return;
          setEdges(edges);

          setEdgeStagger(length * 0.12 > 2 ? 2 / length : 0.12);
          setTimeout(() => setVisible(length > 0), 100);
        }, 116) as unknown as number,
      );
    },
    [reTimer],
  );

  useEffect(() => {
    const edges = vines.svg();
    const edgeLength = edges.length;
    // edgeLength !== edgesLengthRef.current && setVisible(false);
    handleUpdate(edges, edgeLength);
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
            hidden: { opacity: 0, transition: { duration: 0.1 } },
            visible: { opacity: 1, transition: { duration: 0.1, staggerChildren: edgeStagger } },
            exit: { opacity: 0, transition: { duration: 0.1 } },
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
                variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 }, exit: { opacity: 0 } }}
              >
                <path d={path} className="stroke-border dark:stroke-gray-10" />

                <motion.path
                  key={index + '-vines-edge-path'}
                  d={path}
                  transition={{ duration: 0.25 }}
                  exit={{ opacity: 0, pathLength: 0 }}
                />
              </motion.g>
            );
          })}
        </motion.svg>
      )}
    </AnimatePresence>
  );
});

VinesEdges.displayName = 'VinesEdges';
