import React, { useEffect } from 'react';

import { useWindowEvent } from '@mantine/hooks';
import { CircularProgress } from '@nextui-org/progress';
import { AnimatePresence, motion } from 'framer-motion';

import { VinesEdges } from '@/components/layout/vines-flow/edges';
import { VinesHeadlessModal } from '@/components/layout/vines-flow/headless-modal';
import { VinesNodes } from '@/components/layout/vines-flow/nodes';
import { VinesToolbar } from '@/components/layout/vines-flow/toolbar';
import { VinesFlowWrapper } from '@/components/layout/vines-flow/wrapper';
import { useVinesFlowWithPage } from '@/components/layout-wrapper/workspace/utils.ts';
import { useVinesFlow } from '@/package/vines-flow/use.ts';
import { useFlowStore } from '@/store/useFlowStore';
import { CanvasStatus } from '@/store/useFlowStore/typings.ts';
import { usePageStore } from '@/store/usePageStore';
import VinesEvent from '@/utils/events';

interface IVinesFlowProps extends React.ComponentPropsWithoutRef<'div'> {}

export const VinesFlow: React.FC<IVinesFlowProps> = () => {
  const { workflow } = useVinesFlowWithPage();
  const { containerWidth, containerHeight } = usePageStore();
  const { visible, setVisible, setInitialScale, canvasMode } = useFlowStore();
  const {
    vines,
    vinesCanvasSize: { width, height },
    calculateAdaptiveZoom,
  } = useVinesFlow();

  useEffect(() => {
    workflow && vines.update({ workflow });
    if (!workflow?.workflowDef?.tasks?.length) {
      setVisible(false);
    }
  }, [workflow]);

  useEffect(() => {
    const initialScale = calculateAdaptiveZoom(containerWidth, containerHeight);

    if (initialScale) {
      !visible && setVisible(true);
      setInitialScale(initialScale);
    } else if (!containerWidth && !containerHeight) {
      vines.getAllNodes().length && setVisible(true);
    }
  }, [containerWidth, containerHeight, width, height]);
  useWindowEvent('resize', () => {
    canvasMode !== CanvasStatus.RUNNING && requestAnimationFrame(() => VinesEvent.emit('canvas-auto-zoom'));
  });

  return (
    <main className="vines-center relative size-full">
      <VinesFlowWrapper>
        <AnimatePresence>
          {visible && (
            <motion.div
              className="relative"
              key="vines-canvas"
              style={{ width, height }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 0.2 } }}
              exit={{ opacity: 0, transition: { duration: 0.2 } }}
            >
              <VinesEdges />
              <VinesNodes />
            </motion.div>
          )}
        </AnimatePresence>
      </VinesFlowWrapper>
      <AnimatePresence>
        {!visible && (
          <motion.div
            key="vines-canvas-waiting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.2 } }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            transition={{ type: 'linear' }}
            className="vines-center absolute left-0 top-0 z-20 size-full"
          >
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.1 } }}>
              <CircularProgress className="[&_circle:last-child]:stroke-vines-500" size="lg" aria-label="Loading..." />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <VinesHeadlessModal />
      <VinesToolbar />
    </main>
  );
};
