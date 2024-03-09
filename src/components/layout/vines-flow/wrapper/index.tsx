import React, { useCallback, useEffect, useState } from 'react';

import keyboardJS from 'keyboardjs';
import { TransformWrapper } from 'react-zoom-pan-pinch';
import { useFlowStore } from 'src/store/useFlowStore';

import { GridView } from '@/components/layout/vines-flow/wrapper/grid-view.tsx';
import { CanvasStatus } from '@/store/useFlowStore/typings.ts';

interface IVinesFlowWrapperProps extends React.ComponentPropsWithoutRef<'div'> {}

export const VinesFlowWrapper: React.FC<IVinesFlowWrapperProps> = ({ children }) => {
  const { initialScale, isCanvasMoving, canvasMode, setCanvasMoving, setCanvasDisabled } = useFlowStore();

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
