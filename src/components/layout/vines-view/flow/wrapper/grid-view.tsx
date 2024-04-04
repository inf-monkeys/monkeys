import React, { useCallback, useEffect, useRef, useState, WheelEventHandler } from 'react';

import keyboardJS from 'keyboardjs';
import { debounce } from 'lodash';
import { TransformComponent, useControls, useTransformContext, useTransformEffect } from 'react-zoom-pan-pinch';

import { DotsBackground } from '@/components/layout/vines-view/flow/wrapper/background.tsx';
import {
  checkPositionBounds,
  getMousePosition,
  getXYPosition,
  handleZoomToPoint,
} from '@/components/layout/vines-view/flow/wrapper/utlis.ts';
import { useCanvasStore } from '@/store/useCanvasStore';
import { useCanvasInteractionStore } from '@/store/useCanvasStore/interaction.ts';
import { useFlowStore } from '@/store/useFlowStore';
import { cn } from '@/utils';
import VinesEvent from '@/utils/events.ts';

interface IGridViewProps extends React.ComponentPropsWithoutRef<'div'> {
  toggleMoveState: (state?: boolean) => void;
}

export const GridView: React.FC<IGridViewProps> = ({ toggleMoveState, children }) => {
  const { workflowId } = useFlowStore();
  const { initialScale } = useCanvasStore();
  const { isCanvasMoving, isUserInteraction, setScale, setIsUserInteraction } = useCanvasInteractionStore();
  const { zoomIn, zoomOut, centerView, zoomToElement, setTransform } = useControls();

  useTransformEffect(debounce(({ state }) => setScale(state.scale), 100));

  const handleAutoZoom = useCallback(() => centerView(initialScale), [initialScale]);

  useEffect(() => {
    VinesEvent.on('canvas-auto-zoom', () => !isUserInteraction && handleAutoZoom());
    return () => {
      VinesEvent.removeAllListeners('canvas-auto-zoom');
    };
  }, [initialScale, isUserInteraction]);

  useEffect(() => {
    keyboardJS.on(['ctrl + =', 'command + ='], (e) => {
      e?.preventRepeat();
      e?.preventDefault();
      zoomIn();
    });
    keyboardJS.on(['ctrl + -', 'command + -'], (e) => {
      e?.preventRepeat();
      e?.preventDefault();
      zoomOut();
    });
    keyboardJS.on(['ctrl + 1', 'command + 1'], (e) => {
      e?.preventRepeat();
      e?.preventDefault();
      handleAutoZoom();
    });
    VinesEvent.on('canvas-zoom-in', zoomIn);
    VinesEvent.on('canvas-zoom-out', zoomOut);
    VinesEvent.on('canvas-zoom-to-node', (zoomToNodeId) => zoomToElement(zoomToNodeId, 1.2));
    return () => {
      keyboardJS.unbind(['ctrl + =', 'command + =', 'ctrl + -', 'command + -', 'ctrl + 1', 'command + 1']);
      VinesEvent.removeAllListeners('canvas-zoom-in');
      VinesEvent.removeAllListeners('canvas-zoom-out');
      VinesEvent.removeAllListeners('canvas-zoom-to-node');
    };
  }, []);

  const node = useRef<HTMLDivElement>(null);
  const context = useTransformContext();

  const handleWheel = (event: WheelEvent) => {
    event.stopPropagation();

    if (isCanvasMoving) return;

    const {
      transformState: { positionX, positionY, scale },
      setup: {
        limitToBounds,
        minScale,
        maxScale,
        panning: { lockAxisX, lockAxisY },
      },
    } = context;

    //=> 处理手势缩放 | 操作时会自动把 ctrlKey 设置为 true
    if (event.ctrlKey && context.contentComponent) {
      let finalScale = scale;
      finalScale += -event.deltaY * 0.015;
      if (finalScale > maxScale) {
        finalScale = 2;
      } else if (finalScale < minScale) {
        finalScale = 0.3;
      }
      const mousePosition = getMousePosition(event, context.contentComponent, scale);
      const newPosition = handleZoomToPoint(context, finalScale, mousePosition.x, mousePosition.y);
      if (!newPosition) return;
      setTransform(newPosition.positionX, newPosition.positionY, newPosition.scale, 0);
      return;
    }

    if (!((event.target as SVGSVGElement).getAttribute('data-id') === 'vines-drag')) {
      if (isUserInteraction) {
        return;
      }
    } else {
      // 移动时取消用户交互状态
      void (isUserInteraction && setIsUserInteraction(null));
    }

    //=> 处理双指移动
    const mouseX = positionX - event.deltaX;
    const mouseY = positionY - event.deltaY;
    const newPositionX = lockAxisX ? positionX : mouseX;
    const newPositionY = lockAxisY ? positionY : mouseY;

    const paddingValue = scale >= minScale ? 20 : 0;

    if (
      (newPositionX === positionX && newPositionY === positionY) ||
      !context.bounds ||
      !context.wrapperComponent ||
      scale < minScale
    )
      return;

    const { x, y } = checkPositionBounds(
      newPositionX,
      newPositionY,
      context.bounds,
      limitToBounds,
      paddingValue,
      context.wrapperComponent,
    );

    setTransform(x, y, scale, 0);
  };

  useEffect(() => {
    VinesEvent.on('canvas-zoom-to', (x, y, scale) => {
      const {
        transformState: { scale: originScale },
      } = context;

      if (!context.contentComponent || !context.wrapperComponent) return;

      const finalScale = scale ?? originScale;
      const calcPosition = getXYPosition(x, y, context.contentComponent, context.wrapperComponent, finalScale);

      const newPosition = handleZoomToPoint(context, finalScale, calcPosition.x, calcPosition.y);
      if (!newPosition) return;
      setTransform(calcPosition.x, calcPosition.y, newPosition.scale);
    });

    return () => {
      VinesEvent.off('canvas-zoom-to');
    };
  }, [context]);

  useEffect(() => {
    const disableWheel = (e: WheelEvent) => {
      if (!((e.target as SVGSVGElement).getAttribute('data-id') === 'vines-drag') && !e.ctrlKey && isUserInteraction) {
        return;
      } else {
        // 缩放时取消用户交互状态
        void (isUserInteraction && setIsUserInteraction(null));
      }
      e.preventDefault();
    };
    node.current?.addEventListener('wheel', disableWheel, { passive: false });
    return () => {
      node.current?.removeEventListener('wheel', disableWheel);
    };
  }, [isUserInteraction]);

  const [startX, setStartX] = useState<number | null>(null);
  const [startY, setStartY] = useState<number | null>(null);

  const movedRef = useRef(false);
  const handleMouseMove = (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
    if (movedRef.current) return;
    if (startX !== null && startY !== null && event.buttons === 2) {
      const distance = Math.sqrt(Math.pow(startY - event.clientY, 2) + Math.pow(startX - event.clientX, 2));
      if (distance > 10) {
        // 设置阈值为50像素
        movedRef.current = true;
        toggleMoveState(true);
      }
    }
  };

  return (
    <TransformComponent>
      <main
        ref={node}
        className={cn(
          'relative flex min-h-[800rem] min-w-[800rem] touch-none items-center justify-center overflow-clip overscroll-x-contain',
          isCanvasMoving && 'cursor-grab',
        )}
        onMouseDown={(e) => {
          if (e.button === 1) toggleMoveState(true);
          setStartX(e.clientX);
          setStartY(e.clientY);
        }}
        onMouseUp={(e) => {
          const button = e.button;
          if (button === 1 || button === 2) toggleMoveState();
          if (movedRef.current) {
            setStartX(null);
            setStartY(null);
            movedRef.current = false;
          } else if ((e.target as SVGSVGElement).getAttribute('data-id') === 'vines-drag' && button === 2) {
            setTimeout(() => VinesEvent.emit('canvas-context-menu', workflowId, e, 'CANVAS'));
          }
        }}
        onMouseMove={handleMouseMove}
        onWheel={handleWheel as unknown as WheelEventHandler<HTMLElement>}
      >
        {children}

        <DotsBackground
          className="z-0 opacity-50"
          size={3}
          gap={50}
          onContextMenu={(e: React.MouseEvent<SVGSVGElement, MouseEvent>) => e.preventDefault()}
        />
      </main>
    </TransformComponent>
  );
};
