import React, { useRef } from 'react';

import { useMemoizedFn } from 'ahooks';

interface DrawHistory {
  imageData: ImageData;
  timestamp: number;
}

export interface IVinesMaskEditorProps {
  maskCanvasRef: React.RefObject<HTMLCanvasElement>;
  cursorCanvasRef: React.RefObject<HTMLCanvasElement>;
  tempMaskCanvasRef: React.RefObject<HTMLCanvasElement>;

  brushSize?: number;
  pointerMode?: 'brush' | 'eraser';
  maskColor?: string;
  brushType?: 'normal' | 'rectangle' | 'lasso';

  zoom?: number;

  onDrawEnd?: () => void;
  onHistoryChange?: (canUndo: boolean, canRedo: boolean) => void;
}

export const useVinesMaskEditor = ({
  maskCanvasRef,
  cursorCanvasRef,
  tempMaskCanvasRef,
  brushSize = 12,
  pointerMode = 'brush',
  maskColor = 'rgb(0,0,0)',
  brushType = 'normal',
  zoom = 1,
  onDrawEnd,
  onHistoryChange,
}: IVinesMaskEditorProps) => {
  const isDrawingRef = useRef(false);
  const lastPositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const startPositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lassoPointsRef = useRef<{ x: number; y: number }[]>([]);

  const isErasingRef = useRef(false);

  const calculateOffset = (value: number) => value / zoom;

  const onPointerMove = useMemoizedFn((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!maskCanvasRef.current || !tempMaskCanvasRef.current) return;

    const tempCtx = tempMaskCanvasRef.current.getContext('2d')!;

    const cursorCanvas = cursorCanvasRef.current;
    if (cursorCanvas) {
      const cursorX = calculateOffset(e.nativeEvent.offsetX);
      const cursorY = calculateOffset(e.nativeEvent.offsetY);
      const cursorCanvasStyle = cursorCanvas.style;
      cursorCanvasStyle.width = brushSize * 2 + 'px';
      cursorCanvasStyle.height = brushSize * 2 + 'px';
      cursorCanvasStyle.left = cursorX - brushSize + 'px';
      cursorCanvasStyle.top = cursorY - brushSize + 'px';
    }

    const buttons = e.buttons;
    const leftButtonDown = (window.TouchEvent && e instanceof TouchEvent) || buttons == 1;
    const rightButtonDown = [2, 5, 32].includes(buttons);

    const x = calculateOffset(e.nativeEvent.offsetX);
    const y = calculateOffset(e.nativeEvent.offsetY);

    const isErasing = ((e.altKey || pointerMode == 'eraser') && leftButtonDown) || rightButtonDown;
    const shouldDraw = (!e.altKey && pointerMode == 'brush' && leftButtonDown) || isErasing;

    if (shouldDraw) {
      e.preventDefault();

      const drawOperation = () => {
        const ctx = tempCtx;
        ctx.beginPath();
        ctx.globalCompositeOperation = 'source-over';
        if (isErasing) {
          isErasingRef.current = true;
          ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
          ctx.strokeStyle = 'rgb(255, 0, 0)';
          ctx.lineWidth = 2;
        } else {
          ctx.fillStyle = maskColor;
        }

        if (brushType === 'normal') {
          if (!isDrawingRef.current) {
            ctx.arc(x, y, brushSize, 0, Math.PI * 2, false);
            ctx.fill();
            lastPositionRef.current = { x, y };
          } else {
            const { x: lastX, y: lastY } = lastPositionRef.current;
            const dx = x - lastX;
            const dy = y - lastY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const directionX = dx / distance;
            const directionY = dy / distance;

            for (let i = 0; i < distance; i += 5) {
              const px = lastX + directionX * i;
              const py = lastY + directionY * i;
              ctx.arc(px, py, brushSize, 0, Math.PI * 2, false);
              ctx.fill();
            }
            lastPositionRef.current = { x, y };
          }
        } else if (brushType === 'rectangle') {
          maskCanvasRef.current?.style.setProperty('opacity', '0.6');

          ctx.clearRect(0, 0, tempMaskCanvasRef.current!.width, tempMaskCanvasRef.current!.height);
          const startX = startPositionRef.current.x;
          const startY = startPositionRef.current.y;
          const width = x - startX;
          const height = y - startY;
          ctx.fillRect(startX, startY, width, height);

          if (isErasing) {
            ctx.strokeRect(startX, startY, width, height);
          }
        } else if (brushType === 'lasso') {
          maskCanvasRef.current?.style.setProperty('opacity', '0.6');
          ctx.clearRect(0, 0, tempMaskCanvasRef.current!.width, tempMaskCanvasRef.current!.height);

          if (lassoPointsRef.current.length > 0) {
            ctx.beginPath();
            ctx.moveTo(lassoPointsRef.current[0].x, lassoPointsRef.current[0].y);

            for (let i = 1; i < lassoPointsRef.current.length; i++) {
              ctx.lineTo(lassoPointsRef.current[i].x, lassoPointsRef.current[i].y);
            }
            ctx.lineTo(x, y);

            if (isErasing) {
              ctx.strokeStyle = 'rgb(255, 0, 0)';
            } else {
              ctx.strokeStyle = maskColor;
            }
            ctx.lineWidth = 2;
            ctx.stroke();
          }
          lassoPointsRef.current.push({ x, y });
        }
      };

      requestAnimationFrame(drawOperation);
    }
  });

  const onPointerDown = useMemoizedFn((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!maskCanvasRef.current || !tempMaskCanvasRef.current) return;

    const ctx = tempMaskCanvasRef.current.getContext('2d')!;

    if ([0, 2, 5].includes(e.button)) {
      if (historyRef.current.length === 0) {
        const maskCtx = maskCanvasRef.current.getContext('2d')!;
        const initialImageData = maskCtx.getImageData(
          0,
          0,
          maskCanvasRef.current.width,
          maskCanvasRef.current.height
        );
        historyRef.current.push({
          imageData: initialImageData,
          timestamp: Date.now(),
        });
        currentHistoryIndexRef.current = 0;
      }

      isDrawingRef.current = true;

      e.preventDefault();

      const x = calculateOffset(e.nativeEvent.offsetX);
      const y = calculateOffset(e.nativeEvent.offsetY);

      maskCanvasRef.current?.style.setProperty('opacity', '0.6');

      ctx.beginPath();
      if (!e.altKey && pointerMode == 'brush' && e.button == 0) {
        ctx.fillStyle = maskColor;
        ctx.globalCompositeOperation = 'source-over';
      } else {
        isErasingRef.current = true;
        ctx.globalCompositeOperation = 'destination-out';
      }

      if (brushType === 'normal') {
        ctx.arc(x, y, brushSize, 0, Math.PI * 2, false);
        ctx.fill();
      } else if (brushType === 'rectangle') {
        startPositionRef.current = { x, y };
      } else if (brushType === 'lasso') {
        lassoPointsRef.current = [{ x, y }];
      }

      lastPositionRef.current = { x, y };
    }
  });

  const onPointerUp = useMemoizedFn((e: React.PointerEvent<HTMLCanvasElement>) => {
    maskCanvasRef.current?.style.setProperty('opacity', '1');

    if (maskCanvasRef.current && tempMaskCanvasRef.current) {
      const maskCtx = maskCanvasRef.current.getContext('2d')!;
      const tempCtx = tempMaskCanvasRef.current.getContext('2d')!;

      if (brushType === 'lasso' && lassoPointsRef.current.length > 2) {
        tempCtx.clearRect(0, 0, tempMaskCanvasRef.current.width, tempMaskCanvasRef.current.height);
        tempCtx.beginPath();
        tempCtx.moveTo(lassoPointsRef.current[0].x, lassoPointsRef.current[0].y);

        for (let i = 1; i < lassoPointsRef.current.length; i++) {
          tempCtx.lineTo(lassoPointsRef.current[i].x, lassoPointsRef.current[i].y);
        }

        tempCtx.closePath();
        if (pointerMode === 'brush' && !isErasingRef.current) {
          tempCtx.fillStyle = maskColor;
          tempCtx.fill();
        } else {
          tempCtx.fillStyle = 'rgba(255, 0, 0, 0.5)';
          tempCtx.fill();
          tempCtx.strokeStyle = 'rgb(255, 0, 0)';
          tempCtx.stroke();
        }
      }

      if (pointerMode === 'brush' && e.button !== 2 && !isErasingRef.current) {
        maskCtx.drawImage(tempMaskCanvasRef.current, 0, 0);
      } else {
        maskCtx.globalCompositeOperation = 'destination-out';
        if (brushType === 'rectangle') {
          maskCtx.fillStyle = 'rgba(0, 0, 0, 1)';
          maskCtx.fillRect(
            startPositionRef.current.x,
            startPositionRef.current.y,
            calculateOffset(e.nativeEvent.offsetX) - startPositionRef.current.x,
            calculateOffset(e.nativeEvent.offsetY) - startPositionRef.current.y,
          );
        } else if (brushType === 'lasso') {
          maskCtx.fillStyle = 'rgba(0, 0, 0, 1)';
          maskCtx.beginPath();
          maskCtx.moveTo(lassoPointsRef.current[0].x, lassoPointsRef.current[0].y);
          for (let i = 1; i < lassoPointsRef.current.length; i++) {
            maskCtx.lineTo(lassoPointsRef.current[i].x, lassoPointsRef.current[i].y);
          }
          maskCtx.closePath();
          maskCtx.fill();
        }
        maskCtx.drawImage(tempMaskCanvasRef.current, 0, 0);
        maskCtx.globalCompositeOperation = 'source-over';
      }

      tempCtx.clearRect(0, 0, tempMaskCanvasRef.current.width, tempMaskCanvasRef.current.height);

      saveToHistory();
      onDrawEnd?.();
    }
    isDrawingRef.current = false;
    isErasingRef.current = false;
    lassoPointsRef.current = [];
  });

  const onPointerLeave = useMemoizedFn(() => {
    maskCanvasRef.current?.style.setProperty('opacity', '1');

    if (maskCanvasRef.current && tempMaskCanvasRef.current) {
      const tempCtx = tempMaskCanvasRef.current.getContext('2d')!;
      tempCtx.clearRect(0, 0, tempMaskCanvasRef.current.width, tempMaskCanvasRef.current.height);
    }
    isDrawingRef.current = false;
    isErasingRef.current = false;
    lassoPointsRef.current = [];
  });

  const handleCleanMask = useMemoizedFn(() => {
    if (!maskCanvasRef.current || !tempMaskCanvasRef.current) return;

    if (historyRef.current.length === 0) {
      const ctx = maskCanvasRef.current.getContext('2d')!;
      const initialImageData = ctx.getImageData(
        0,
        0,
        maskCanvasRef.current.width,
        maskCanvasRef.current.height
      );
      historyRef.current.push({
        imageData: initialImageData,
        timestamp: Date.now(),
      });
      currentHistoryIndexRef.current = 0;
    }

    const tempCtx = tempMaskCanvasRef.current.getContext('2d')!;
    tempCtx.clearRect(0, 0, tempMaskCanvasRef.current.width, tempMaskCanvasRef.current.height);

    const ctx = maskCanvasRef.current.getContext('2d')!;
    ctx.clearRect(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);

    saveToHistory();
    onDrawEnd?.();
  });

  const historyRef = useRef<DrawHistory[]>([]);
  const currentHistoryIndexRef = useRef<number>(-1);

  const saveToHistory = useMemoizedFn(() => {
    if (!maskCanvasRef.current) return;

    const ctx = maskCanvasRef.current.getContext('2d')!;
    const imageData = ctx.getImageData(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);

    historyRef.current = historyRef.current.slice(0, currentHistoryIndexRef.current + 1);

    historyRef.current.push({
      imageData,
      timestamp: Date.now(),
    });

    currentHistoryIndexRef.current++;

    onHistoryChange?.(currentHistoryIndexRef.current > 0, false);
  });

  const undo = useMemoizedFn(() => {
    if (!maskCanvasRef.current || currentHistoryIndexRef.current <= 0) return;

    currentHistoryIndexRef.current--;
    const previousState = historyRef.current[currentHistoryIndexRef.current];

    const ctx = maskCanvasRef.current.getContext('2d')!;
    ctx.putImageData(previousState.imageData, 0, 0);

    onHistoryChange?.(currentHistoryIndexRef.current > 0, true);
    onDrawEnd?.();
  });

  const redo = useMemoizedFn(() => {
    if (!maskCanvasRef.current || currentHistoryIndexRef.current >= historyRef.current.length - 1) return;

    currentHistoryIndexRef.current++;
    const nextState = historyRef.current[currentHistoryIndexRef.current];

    const ctx = maskCanvasRef.current.getContext('2d')!;
    ctx.putImageData(nextState.imageData, 0, 0);

    onHistoryChange?.(true, currentHistoryIndexRef.current < historyRef.current.length - 1);
    onDrawEnd?.();
  });

  return {
    onPointerMove,
    onPointerDown,
    onPointerUp,
    onPointerLeave,
    handleCleanMask,
    undo,
    redo,
  };
};
