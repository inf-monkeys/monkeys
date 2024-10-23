import React, { useEffect } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { get } from 'lodash';

import { VinesEdges } from '@/components/layout/workspace/vines-view/flow/edges';
import { VinesHeadlessModal } from '@/components/layout/workspace/vines-view/flow/headless-modal';
import { VinesNodes } from '@/components/layout/workspace/vines-view/flow/nodes';
import { VinesToolbar } from '@/components/layout/workspace/vines-view/flow/toolbar';
import { VinesExpandToolbar } from '@/components/layout/workspace/vines-view/flow/toolbar/expand';
import { VinesFlowWrapper } from '@/components/layout/workspace/vines-view/flow/wrapper';
import { VinesLoading } from '@/components/ui/loading';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useWindowEvent } from '@/hooks/use-window-event.ts';
import { IVinesFlowRenderOptions, IVinesFlowRenderType } from '@/package/vines-flow/core/typings.ts';
import { useVinesFlow } from '@/package/vines-flow/use.ts';
import { useCanvasStore } from '@/store/useCanvasStore';
import { useFlowStore } from '@/store/useFlowStore';
import { CanvasStatus } from '@/store/useFlowStore/typings.ts';
import { usePageStore } from '@/store/usePageStore';
import { cn } from '@/utils';
import VinesEvent from '@/utils/events.ts';
import { VinesFlowEvents } from '@/view/vines-flow/events.tsx';

interface IVinesFlowProps {}

const VinesFlow: React.FC<IVinesFlowProps> = () => {
  const workflowId = useFlowStore((s) => s.workflowId);

  const containerWidth = usePageStore((s) => s.containerWidth);
  const containerHeight = usePageStore((s) => s.containerHeight);
  const page = usePageStore((s) => s.page);
  const workbenchVisible = usePageStore((s) => s.workbenchVisible);

  const canvasMode = useCanvasStore((s) => s.canvasMode);
  const visible = useCanvasStore((s) => s.visible);
  const setVisible = useCanvasStore((s) => s.setVisible);
  const setInitialScale = useCanvasStore((s) => s.setInitialScale);

  const {
    vines,
    vinesCanvasSize: { width, height },
    calculateAdaptiveZoom,
  } = useVinesFlow();

  const [localRenderDirection] = useLocalStorage<string>('vines-ui-process-page-render-direction', 'false', false);
  const [localRenderType] = useLocalStorage<Record<string, IVinesFlowRenderType>>('vines-ui-process-page-render-type', {
    [workflowId]: IVinesFlowRenderType.SIMPLIFY,
  });

  useEffect(() => {
    const renderDirection = (
      get(page, 'customOptions.render.useHorizontal', localRenderDirection === 'true') ? 'horizontal' : 'vertical'
    ) as IVinesFlowRenderOptions['direction'];
    const renderType = get(
      page,
      'customOptions.render.type',
      localRenderType[workflowId],
    ) as IVinesFlowRenderOptions['type'];
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
    <main className={cn('vines-center relative size-full', workbenchVisible && 'px-4')}>
      <VinesFlowWrapper>
        <AnimatePresence>
          {visible && (
            <motion.div
              className="relative z-10"
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
              <VinesLoading />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {visible && (
        <>
          <VinesHeadlessModal />
          <VinesToolbar />
          <VinesExpandToolbar />
          <VinesFlowEvents />
        </>
      )}
    </main>
  );
};

export default VinesFlow;
