import React, { useEffect, useState } from 'react';

import { useWindowEvent } from '@mantine/hooks';
import { motion } from 'framer-motion';

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
  const { setInitialScale, canvasMode } = useFlowStore();
  const {
    vines,
    vinesCanvasSize: { width, height },
    calculateAdaptiveZoom,
  } = useVinesFlow();

  useEffect(() => {
    workflow && vines.update({ workflow });
  }, [workflow]);

  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const initialScale = calculateAdaptiveZoom(containerWidth, containerHeight);

    if (initialScale) {
      !visible && setVisible(true);
      setInitialScale(initialScale);
    }
  }, [containerWidth, containerHeight, width, height]);
  useWindowEvent('resize', () => {
    canvasMode !== CanvasStatus.RUNNING && requestAnimationFrame(() => VinesEvent.emit('canvas-auto-zoom'));
  });

  return (
    <main className="vines-center size-full">
      <VinesFlowWrapper>
        <motion.div
          variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
          animate={visible ? 'visible' : 'hidden'}
          className="relative opacity-0"
          id="vines-canvas"
          style={{ width, height }}
        ></motion.div>
      </VinesFlowWrapper>
    </main>
  );
};
