import React, { useCallback, useEffect, useState } from 'react';

import keyboardJS from 'keyboardjs';
import { TransformWrapper } from 'react-zoom-pan-pinch';

import { GridView } from '@/components/layout/workspace/vines-view/flow/wrapper/grid-view.tsx';
import { useCanvasStore } from '@/store/useCanvasStore';
import { useCanvasInteractionStore } from '@/store/useCanvasStore/interaction.ts';
import { CanvasStatus } from '@/store/useFlowStore/typings.ts';

interface IVinesFlowWrapperProps extends React.ComponentPropsWithoutRef<'div'> {}

export const VinesFlowWrapper: React.FC<IVinesFlowWrapperProps> = ({ children }) => {
  const initialScale = useCanvasStore((s) => s.initialScale);
  const canvasMode = useCanvasStore((s) => s.canvasMode);

  const isCanvasMoving = useCanvasInteractionStore((s) => s.isCanvasMoving);
  const setCanvasMoving = useCanvasInteractionStore((s) => s.setCanvasMoving);
  const setCanvasDisabled = useCanvasInteractionStore((s) => s.setCanvasDisabled);

  const [isToggleScale, setIsToggleScale] = useState(false);

  const handleUxEvent = useCallback(
    (disable = false) => {
      setCanvasMoving(disable);
      canvasMode !== CanvasStatus.RUNNING && setCanvasDisabled(disable);
    },
    [canvasMode],
  );

  useEffect(() => {
    keyboardJS.on(
      ['space', 'spacebar'],
      (e) => {
        e?.preventRepeat();
        handleUxEvent(true);
      },
      () => handleUxEvent(),
    );
    keyboardJS.on(
      'ctrl',
      (e) => {
        e?.preventDefault();
        e?.preventRepeat();
        setIsToggleScale(true);
      },
      () => setIsToggleScale(false),
    );
    return () => {
      keyboardJS.unbind(['space', 'spacebar', 'ctrl']);
    };
  }, []);

  return (
    <TransformWrapper
      centerOnInit
      panning={{
        disabled: !isCanvasMoving && canvasMode === CanvasStatus.EDIT,
        excluded: ['input', 'span', 'p', 'textarea'],
      }}
      wheel={{ disabled: !isToggleScale, excluded: ['input', 'span', 'p', 'textarea'] }}
      minScale={0.3}
      maxScale={2}
      initialScale={initialScale}
      alignmentAnimation={{ sizeY: 200 }}
      limitToBounds={false}
    >
      <GridView toggleMoveState={handleUxEvent}>{children}</GridView>
    </TransformWrapper>
  );
};
