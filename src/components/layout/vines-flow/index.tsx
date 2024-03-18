import React, { useEffect, useRef } from 'react';

import { useParams } from '@tanstack/react-router';

import { useWindowEvent } from '@mantine/hooks';
import { CircularProgress } from '@nextui-org/progress';
import { AnimatePresence, motion } from 'framer-motion';

import { useGetWorkflow } from '@/apis/workflow';
import { VinesEdges } from '@/components/layout/vines-flow/edges';
import { VinesFlowEvents } from '@/components/layout/vines-flow/events.tsx';
import { VinesHeadlessModal } from '@/components/layout/vines-flow/headless-modal';
import { VinesNodes } from '@/components/layout/vines-flow/nodes';
import { VinesToolbar } from '@/components/layout/vines-flow/toolbar';
import { VinesVersionToolbar } from '@/components/layout/vines-flow/toolbar/version';
import { VinesFlowWrapper } from '@/components/layout/vines-flow/wrapper';
import { useVinesFlow } from '@/package/vines-flow/use.ts';
import { useFlowStore } from '@/store/useFlowStore';
import { CanvasStatus } from '@/store/useFlowStore/typings.ts';
import { usePageStore } from '@/store/usePageStore';
import { useLocalStorage } from '@/utils';
import VinesEvent from '@/utils/events';

interface IVinesFlowProps extends React.ComponentPropsWithoutRef<'div'> {
  workflowId?: string;
}

export const VinesFlow: React.FC<IVinesFlowProps> = ({ workflowId }) => {
  const { containerWidth, containerHeight } = usePageStore();
  const { setWorkflowId, visible, setVisible, setInitialScale, canvasMode } = useFlowStore();

  const { workflowId: pageWorkflowId } = useParams({ from: '/$teamId/workspace/$workflowId/$pageId' });
  const finalWorkflowId = pageWorkflowId ?? workflowId ?? '';

  const {
    vines,
    vinesCanvasSize: { width, height },
    calculateAdaptiveZoom,
  } = useVinesFlow();

  const initialWorkflowVersionRef = useRef<number>();
  const vinesVersion = vines.version;
  const finalVersion = vinesVersion && initialWorkflowVersionRef.current !== vinesVersion ? vinesVersion : void 0;
  const { data: workflow } = useGetWorkflow(
    finalWorkflowId,
    finalVersion,
    useLocalStorage('vines-apikey', '', false)[0],
  );

  useEffect(() => {
    workflowId && setWorkflowId(finalWorkflowId);
    if (workflow) {
      if (!initialWorkflowVersionRef.current) {
        initialWorkflowVersionRef.current = workflow.version;
      }
      vines.update({ workflow });
    }
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
      <VinesVersionToolbar />
      <VinesFlowEvents />
    </main>
  );
};
