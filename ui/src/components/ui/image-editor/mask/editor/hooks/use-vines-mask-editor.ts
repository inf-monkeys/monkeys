import React, { useRef } from 'react';

import { useMemoizedFn } from 'ahooks';

interface DrawHistory {
  imageData: ImageData; // 图像数据
  timestamp: number; // 时间戳
}

export interface IVinesMaskEditorProps {
  maskCanvasRef: React.RefObject<HTMLCanvasElement>; // 遮罩层 canvas 引用
  cursorCanvasRef: React.RefObject<HTMLCanvasElement>; // 光标 canvas 引用
  tempMaskCanvasRef: React.RefObject<HTMLCanvasElement>; // 临时遮罩层 canvas 引用

  brushSize?: number; // 画笔大小
  pointerMode?: 'brush' | 'eraser'; // 指针模式：画笔或橡皮擦
  maskColor?: string; // 遮罩颜色
  brushType?: 'normal' | 'rectangle' | 'lasso'; // 画笔类型：普通、矩形、套索

  zoom?: number; // 缩放比例

  onDrawEnd?: () => void; // 绘制结束回调
  onHistoryChange?: (canUndo: boolean, canRedo: boolean) => void; // 历史记录变化回调
}

export const useVinesMaskEditor = ({
  maskCanvasRef,
  cursorCanvasRef,
  tempMaskCanvasRef,
  brushSize = 12, // 默认画笔大小为 12
  pointerMode = 'brush', // 默认指针模式为画笔
  maskColor = 'rgb(0,0,0)', // 默认遮罩颜色为黑色
  brushType = 'normal', // 默认画笔类型为普通
  zoom = 1, // 默认缩放比例为 1
  onDrawEnd,
  onHistoryChange,
}: IVinesMaskEditorProps) => {
  // 定义各种状态引用
  const isDrawingRef = useRef(false); // 是否正在绘制
  const lastPositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 }); // 上一次绘制位置
  const startPositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 }); // 开始绘制位置
  const lassoPointsRef = useRef<{ x: number; y: number }[]>([]); // 套索工具的点集合

  const isErasingRef = useRef(false); // 是否正在擦除

  // 计算实际偏移量（考虑缩放）
  const calculateOffset = (value: number) => value / zoom;

  // 定义指针移动事件处理函数
  const onPointerMove = useMemoizedFn((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!maskCanvasRef.current || !tempMaskCanvasRef.current) return;

    const tempCtx = tempMaskCanvasRef.current.getContext('2d')!;

    // 更新光标位置和大小
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

    // 检查鼠标按键状态
    const buttons = e.buttons;
    const leftButtonDown = (window.TouchEvent && e instanceof TouchEvent) || buttons == 1;
    const rightButtonDown = [2, 5, 32].includes(buttons);

    // 计算当前位置
    const x = calculateOffset(e.nativeEvent.offsetX);
    const y = calculateOffset(e.nativeEvent.offsetY);

    // 判断是否擦除和是否应该绘制
    const isErasing = ((e.altKey || pointerMode == 'eraser') && leftButtonDown) || rightButtonDown;
    const shouldDraw = (!e.altKey && pointerMode == 'brush' && leftButtonDown) || isErasing;

    if (shouldDraw) {
      e.preventDefault();

      // 定义绘制操作
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

        // 根据不同的画笔类型执行不同的绘制逻辑
        if (brushType === 'normal') {
          if (!isDrawingRef.current) {
            // 首次绘制点
            ctx.arc(x, y, brushSize, 0, Math.PI * 2, false);
            ctx.fill();
            lastPositionRef.current = { x, y };
          } else {
            // 连续绘制线段
            const { x: lastX, y: lastY } = lastPositionRef.current;
            const dx = x - lastX;
            const dy = y - lastY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const directionX = dx / distance;
            const directionY = dy / distance;

            // 插值绘制点，使线条更平滑
            for (let i = 0; i < distance; i += 5) {
              const px = lastX + directionX * i;
              const py = lastY + directionY * i;
              ctx.arc(px, py, brushSize, 0, Math.PI * 2, false);
              ctx.fill();
            }
            lastPositionRef.current = { x, y };
          }
        } else if (brushType === 'rectangle') {
          // 矩形工具绘制逻辑
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
          // 套索工具绘制逻辑
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

      // 使用 requestAnimationFrame 优化绘制性能
      requestAnimationFrame(drawOperation);
    }
  });

  // 定义指针按下事件处理函数
  const onPointerDown = useMemoizedFn((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!maskCanvasRef.current || !tempMaskCanvasRef.current) return;

    const ctx = tempMaskCanvasRef.current.getContext('2d')!;

    if ([0, 2, 5].includes(e.button)) {
      // 如果历史记录为空，保存初始状态
      if (historyRef.current.length === 0) {
        const maskCtx = maskCanvasRef.current.getContext('2d')!;
        const initialImageData = maskCtx.getImageData(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);
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

      // 根据画笔类型执行不同的初始化操作
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

  // 定义指针抬起事件处理函数
  const onPointerUp = useMemoizedFn((e: React.PointerEvent<HTMLCanvasElement>) => {
    maskCanvasRef.current?.style.setProperty('opacity', '1');

    if (maskCanvasRef.current && tempMaskCanvasRef.current) {
      const maskCtx = maskCanvasRef.current.getContext('2d')!;
      const tempCtx = tempMaskCanvasRef.current.getContext('2d')!;

      // 处理套索工具的闭合
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

      // 将临时画布内容应用到主画布
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

      // 清除临时画布
      tempCtx.clearRect(0, 0, tempMaskCanvasRef.current.width, tempMaskCanvasRef.current.height);

      // 保存历史记录并触发回调
      saveToHistory();
      onDrawEnd?.();
    }
    // 重置状态
    isDrawingRef.current = false;
    isErasingRef.current = false;
    lassoPointsRef.current = [];
  });

  // 定义指针离开事件处理函数
  const onPointerLeave = useMemoizedFn(() => {
    maskCanvasRef.current?.style.setProperty('opacity', '1');

    if (maskCanvasRef.current && tempMaskCanvasRef.current) {
      const tempCtx = tempMaskCanvasRef.current.getContext('2d')!;
      tempCtx.clearRect(0, 0, tempMaskCanvasRef.current.width, tempMaskCanvasRef.current.height);
    }
    // 重置状态
    isDrawingRef.current = false;
    isErasingRef.current = false;
    lassoPointsRef.current = [];
  });

  // 清除遮罩层函数
  const handleCleanMask = useMemoizedFn(() => {
    if (!maskCanvasRef.current || !tempMaskCanvasRef.current) return;

    // 如果历史记录为空，保存初始状态
    if (historyRef.current.length === 0) {
      const ctx = maskCanvasRef.current.getContext('2d')!;
      const initialImageData = ctx.getImageData(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);
      historyRef.current.push({
        imageData: initialImageData,
        timestamp: Date.now(),
      });
      currentHistoryIndexRef.current = 0;
    }

    // 清除临时画布和主画布
    const tempCtx = tempMaskCanvasRef.current.getContext('2d')!;
    tempCtx.clearRect(0, 0, tempMaskCanvasRef.current.width, tempMaskCanvasRef.current.height);

    const ctx = maskCanvasRef.current.getContext('2d')!;
    ctx.clearRect(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);

    // 保存历史记录并触发回调
    saveToHistory();
    onDrawEnd?.();
  });

  // 历史记录相关状态
  const historyRef = useRef<DrawHistory[]>([]); // 历史记录数组
  const currentHistoryIndexRef = useRef<number>(-1); // 当前历史记录索引

  // 保存到历史记录
  const saveToHistory = useMemoizedFn(() => {
    if (!maskCanvasRef.current) return;

    const ctx = maskCanvasRef.current.getContext('2d')!;
    const imageData = ctx.getImageData(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);

    // 移除当前索引之后的历史记录
    historyRef.current = historyRef.current.slice(0, currentHistoryIndexRef.current + 1);

    // 添加新的历史记录
    historyRef.current.push({
      imageData,
      timestamp: Date.now(),
    });

    currentHistoryIndexRef.current++;

    // 触发历史记录变化回调
    onHistoryChange?.(currentHistoryIndexRef.current > 0, false);
  });

  // 撤销操作
  const undo = useMemoizedFn(() => {
    if (!maskCanvasRef.current || currentHistoryIndexRef.current <= 0) return;

    currentHistoryIndexRef.current--;
    const previousState = historyRef.current[currentHistoryIndexRef.current];

    const ctx = maskCanvasRef.current.getContext('2d')!;
    ctx.putImageData(previousState.imageData, 0, 0);

    // 触发历史记录变化回调
    onHistoryChange?.(currentHistoryIndexRef.current > 0, true);
    onDrawEnd?.();
  });

  // 重做操作
  const redo = useMemoizedFn(() => {
    if (!maskCanvasRef.current || currentHistoryIndexRef.current >= historyRef.current.length - 1) return;

    currentHistoryIndexRef.current++;
    const nextState = historyRef.current[currentHistoryIndexRef.current];

    const ctx = maskCanvasRef.current.getContext('2d')!;
    ctx.putImageData(nextState.imageData, 0, 0);

    // 触发历史记录变化回调
    onHistoryChange?.(true, currentHistoryIndexRef.current < historyRef.current.length - 1);
    onDrawEnd?.();
  });

  // 返回所有事件处理函数
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
