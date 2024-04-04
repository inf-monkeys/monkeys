import React, { useEffect } from 'react';

import { useWindowEvent } from '@mantine/hooks';
import { CircularProgress } from '@nextui-org/progress';
import { AnimatePresence, motion } from 'framer-motion';
import { get } from 'lodash';
import { VinesEdges } from 'src/components/layout/vines-view/flow/edges';
import { VinesFlowWrapper } from 'src/components/layout/vines-view/flow/wrapper';

import { VinesHeadlessModal } from '@/components/layout/vines-view/flow/headless-modal';
import { VinesNodes } from '@/components/layout/vines-view/flow/nodes';
import { VinesToolbar } from '@/components/layout/vines-view/flow/toolbar';
import { VinesExpandToolbar } from '@/components/layout/vines-view/flow/toolbar/expand';
import { IVinesFlowRenderOptions, IVinesFlowRenderType } from '@/package/vines-flow/core/typings.ts';
import { useVinesFlow } from '@/package/vines-flow/use.ts';
import { useCanvasStore } from '@/store/useCanvasStore';
import { CanvasStatus } from '@/store/useFlowStore/typings.ts';
import { usePageStore } from '@/store/usePageStore';
import { useLocalStorage } from '@/utils';
import VinesEvent from '@/utils/events.ts';
import { VinesFlowEvents } from '@/view/vines-flow/events.tsx';

interface IVinesFlowProps {}

export const VinesFlow: React.FC<IVinesFlowProps> = () => {
  const { containerWidth, containerHeight, page } = usePageStore();
  const { canvasMode, visible, setVisible, setInitialScale } = useCanvasStore();

  const {
    vines,
    vinesCanvasSize: { width, height },
    calculateAdaptiveZoom,
  } = useVinesFlow();

  const [localRenderDirection] = useLocalStorage<string>('vines-ui-process-page-render-direction', 'false', false);
  const [localRenderType] = useLocalStorage<string>(
    'vines-ui-process-page-render-type',
    IVinesFlowRenderType.SIMPLIFY,
    false,
  );

  useEffect(() => {
    const renderDirection = (
      get(page, 'customOptions.render.useHorizontal', localRenderDirection === 'true') ? 'horizontal' : 'vertical'
    ) as IVinesFlowRenderOptions['direction'];
    const renderType = get(page, 'customOptions.render.type', localRenderType) as IVinesFlowRenderOptions['type'];
    vines.update({ renderDirection, renderType });
  }, [page, localRenderDirection, localRenderType]);

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
      <VinesExpandToolbar />
      <VinesFlowEvents />
    </main>
  );
};
