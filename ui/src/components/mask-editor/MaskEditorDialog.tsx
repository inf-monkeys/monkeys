import {
  Brush,
  Circle,
  Eraser,
  Hand,
  PenLine,
  RefreshCcw,
  RotateCcw,
  Square
} from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/utils';

type Mode = 'brush' | 'eraser' | 'rect' | 'ellipse' | 'pen' | 'pan' | 'line';

type MaskEditorDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  image?: File | string | null;
  initMask?: File | string | null;
  title?: string;
  onMaskGenerated?: (file: File) => void;
};

type Point = { x: number; y: number };

type PenHandleType = 'anchor' | 'in' | 'out';
type PenDragTarget = { index: number; type: PenHandleType };

const toDataUrl = (fileOrUrl?: File | string | null) =>
  new Promise<string | undefined>((resolve) => {
    if (!fileOrUrl) return resolve(undefined);
    if (typeof fileOrUrl === 'string') return resolve(fileOrUrl);
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => resolve(undefined);
    reader.readAsDataURL(fileOrUrl);
  });

const MaskCanvas: React.FC<{
  imageSrc?: string;
  initMaskSrc?: string;
  onExport?: (file: File) => void;
}> = ({ imageSrc, initMaskSrc, onExport }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null); // 原尺寸遮罩
  const [mode, setMode] = useState<Mode>('brush');
  const [brushSize, setBrushSize] = useState(36);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const [isDrawing, setIsDrawing] = useState(false);
  const startPointRef = useRef<Point | null>(null);
  const [previewShape, setPreviewShape] = useState<{ type: 'rect' | 'ellipse'; start: Point; end: Point } | null>(null);
  const [previewLine, setPreviewLine] = useState<{ start: Point; end: Point } | null>(null);
  const [penPoints, setPenPoints] = useState<Point[]>([]);
  const [penHandles, setPenHandles] = useState<
    Array<{ handleIn?: Point; handleOut?: Point }>
  >([]);
  const [penDragTarget, setPenDragTarget] = useState<PenDragTarget | null>(null);
  const [imageInfo, setImageInfo] = useState<{ width: number; height: number; url: string } | null>(null);
  const undoStack = useRef<ImageData[]>([]);
  const [renderTick, setRenderTick] = useState(0);
  const baseImageRef = useRef<HTMLImageElement | null>(null);
  const [showBrushSize, setShowBrushSize] = useState(false);
  const brushSizeBtnRef = useRef<HTMLButtonElement | null>(null);
  const [brushPopoverPos, setBrushPopoverPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const shapeBtnRef = useRef<HTMLButtonElement | null>(null);
  const [shapeMenuPos, setShapeMenuPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const [editorHeight, setEditorHeight] = useState(480);
  const [editorWidth, setEditorWidth] = useState(820);
  const [showShapeMenu, setShowShapeMenu] = useState(false);
  const [shapeType, setShapeType] = useState<'rect' | 'ellipse'>('rect');

  const viewScale = useMemo(() => {
    if (!imageInfo || !canvasRef.current) return 1;
    const { width: imgW, height: imgH } = imageInfo;
    const { clientWidth, clientHeight } = canvasRef.current;
    const fit = Math.min(clientWidth / imgW, clientHeight / imgH);
    return fit * scale;
  }, [imageInfo, scale, renderTick]);

  const centerOffset = useMemo(() => {
    if (!imageInfo || !canvasRef.current) return { x: 0, y: 0 };
    const { width: imgW, height: imgH } = imageInfo;
    const { clientWidth, clientHeight } = canvasRef.current;
    const vw = imgW * viewScale;
    const vh = imgH * viewScale;
    return { x: (clientWidth - vw) / 2 + pan.x, y: (clientHeight - vh) / 2 + pan.y };
  }, [imageInfo, viewScale, pan]);

  // 加载图片 & 初始化遮罩画布
  useEffect(() => {
    let revoke: string | undefined;
    if (!imageSrc) {
      setImageInfo(null);
      baseImageRef.current = null;
      return;
    }
    const img = new Image();
    img.onload = () => {
      baseImageRef.current = img;
      setImageInfo({ width: img.width, height: img.height, url: imageSrc });
      // 初始化遮罩
      const mask = document.createElement('canvas');
      mask.width = img.width;
      mask.height = img.height;
      const maskCtx = mask.getContext('2d');
      if (maskCtx) {
        maskCtx.clearRect(0, 0, mask.width, mask.height);
      }
      maskCanvasRef.current = mask;
      setRenderTick((t) => t + 1);
    };
    img.src = imageSrc;
    revoke = imageSrc.startsWith('blob:') ? imageSrc : undefined;
    return () => {
      if (revoke) URL.revokeObjectURL(revoke);
    };
  }, [imageSrc]);

  // 预置遮罩
  useEffect(() => {
    const loadInitMask = async () => {
      if (!initMaskSrc || !maskCanvasRef.current) return;
      const maskImg = new Image();
      maskImg.onload = () => {
        const maskCtx = maskCanvasRef.current?.getContext('2d');
        if (!maskCtx) return;
        maskCtx.drawImage(maskImg, 0, 0, maskCanvasRef.current!.width, maskCanvasRef.current!.height);
        pushUndo(); // 把初始状态入栈，便于撤销
        setRenderTick((t) => t + 1);
      };
      maskImg.src = initMaskSrc;
    };
    void loadInitMask();
  }, [initMaskSrc]);

  const pushUndo = () => {
    const mask = maskCanvasRef.current;
    if (!mask) return;
    const ctx = mask.getContext('2d');
    if (!ctx) return;
    const data = ctx.getImageData(0, 0, mask.width, mask.height);
    undoStack.current = [...undoStack.current.slice(-20), data]; // 限制栈深
  };

  const hitTestPen = (pt: Point, scale: number): PenDragTarget | null => {
    const radiusAnchor = 8 / scale;
    const radiusHandle = 6 / scale;
    const dist2 = (a: Point, b: Point) => {
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      return dx * dx + dy * dy;
    };

    for (let i = 0; i < penPoints.length; i++) {
      const anchor = penPoints[i];
      if (dist2(pt, anchor) <= radiusAnchor * radiusAnchor) {
        return { index: i, type: 'anchor' };
      }
      const handles = penHandles[i] || {};
      if (handles.handleIn && dist2(pt, handles.handleIn) <= radiusHandle * radiusHandle) {
        return { index: i, type: 'in' };
      }
      if (handles.handleOut && dist2(pt, handles.handleOut) <= radiusHandle * radiusHandle) {
        return { index: i, type: 'out' };
      }
    }
    return null;
  };

  const restoreFromUndo = () => {
    const mask = maskCanvasRef.current;
    if (!mask) return;
    const ctx = mask.getContext('2d');
    if (!ctx) return;
    const last = undoStack.current.pop();
    if (last) {
      ctx.putImageData(last, 0, 0);
      setRenderTick((t) => t + 1);
    }
  };

  const clearMask = () => {
    const mask = maskCanvasRef.current;
    if (!mask) return;
    const ctx = mask.getContext('2d');
    if (!ctx) return;
    pushUndo();
    ctx.clearRect(0, 0, mask.width, mask.height);
    setPenPoints([]);
    setPreviewLine(null);
    setPreviewShape(null);
    setPenHandles([]);
    setPenPoints([]);
    setPenDragTarget(null);
    setRenderTick((t) => t + 1);
  };

  const invertMask = () => {
    const mask = maskCanvasRef.current;
    if (!mask) return;
    const ctx = mask.getContext('2d');
    if (!ctx) return;
    pushUndo();
    const data = ctx.getImageData(0, 0, mask.width, mask.height);
    const arr = data.data;
    for (let i = 0; i < arr.length; i += 4) {
      const alpha = arr[i + 3];
      if (alpha > 0) {
        arr[i] = 0;
        arr[i + 1] = 0;
        arr[i + 2] = 0;
        arr[i + 3] = 0;
      } else {
        arr[i] = 255;
        arr[i + 1] = 255;
        arr[i + 2] = 255;
        arr[i + 3] = 255;
      }
    }
    ctx.putImageData(data, 0, 0);
    setRenderTick((t) => t + 1);
  };

  const toImageCoords = (clientX: number, clientY: number): Point | null => {
    const canvas = canvasRef.current;
    const info = imageInfo;
    if (!canvas || !info) return null;
    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left - centerOffset.x) / viewScale;
    const y = (clientY - rect.top - centerOffset.y) / viewScale;
    return { x: Math.max(0, Math.min(info.width, x)), y: Math.max(0, Math.min(info.height, y)) };
  };

  const drawLine = (from: Point, to: Point, erase = false) => {
    const mask = maskCanvasRef.current;
    if (!mask) return;
    const ctx = mask.getContext('2d');
    if (!ctx) return;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'white';
    ctx.lineWidth = brushSize;
    ctx.globalCompositeOperation = erase ? 'destination-out' : 'source-over';
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    ctx.restore();
  };

  const drawShape = (shape: { type: 'rect' | 'ellipse'; start: Point; end: Point }, erase = false) => {
    const mask = maskCanvasRef.current;
    if (!mask) return;
    const ctx = mask.getContext('2d');
    if (!ctx) return;
    const x = Math.min(shape.start.x, shape.end.x);
    const y = Math.min(shape.start.y, shape.end.y);
    const w = Math.abs(shape.end.x - shape.start.x);
    const h = Math.abs(shape.end.y - shape.start.y);
    ctx.save();
    ctx.fillStyle = 'white';
    ctx.globalCompositeOperation = erase ? 'destination-out' : 'source-over';
    if (shape.type === 'rect') {
      ctx.fillRect(x, y, w, h);
    } else {
      ctx.beginPath();
      ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  };

  const commitPenPath = () => {
    if (penPoints.length < 3) return;
    const mask = maskCanvasRef.current;
    if (!mask) return;
    const ctx = mask.getContext('2d');
    if (!ctx) return;
    pushUndo();
    ctx.save();
    ctx.fillStyle = 'white';
    ctx.beginPath();
    const first = penPoints[0];
    const firstHandles = penHandles[0] || {};
    ctx.moveTo(first.x, first.y);
    for (let i = 0; i < penPoints.length - 1; i++) {
      const p0 = penPoints[i];
      const p1 = penPoints[i + 1];
      const h0 = penHandles[i]?.handleOut ?? p0;
      const h1 = penHandles[i + 1]?.handleIn ?? p1;
      ctx.bezierCurveTo(h0.x, h0.y, h1.x, h1.y, p1.x, p1.y);
    }
    // close to first
    const last = penPoints[penPoints.length - 1];
    const lastH = penHandles[penPoints.length - 1]?.handleOut ?? last;
    const firstHIn = firstHandles.handleIn ?? first;
    ctx.bezierCurveTo(lastH.x, lastH.y, firstHIn.x, firstHIn.y, first.x, first.y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    setPenPoints([]);
    setPenHandles([]);
    setPenDragTarget(null);
    setRenderTick((t) => t + 1);
  };

  const handlePointerDown: React.PointerEventHandler<HTMLCanvasElement> = (event) => {
    if (!imageInfo) return;
    const point = toImageCoords(event.clientX, event.clientY);
    if (!point) return;
    event.currentTarget.setPointerCapture(event.pointerId);

    if (mode === 'pen') {
      // 先检测是否点击到现有锚点或控制柄用于拖动
      const hit = hitTestPen(point, viewScale);
      if (hit) {
        setPenDragTarget(hit);
        setIsDrawing(true);
        return;
      }

      // 点击首点闭合
      if (penPoints.length >= 3) {
        const first = penPoints[0];
        const dx = point.x - first.x;
        const dy = point.y - first.y;
        if (dx * dx + dy * dy < (8 / viewScale) * (8 / viewScale)) {
          commitPenPath();
          return;
        }
      }
      pushUndo();
      setPenPoints((prev) => [...prev, point]);
      setPenHandles((prev) => [...prev, {}]);
      setPenDragTarget({ index: penPoints.length, type: 'out' });
      setIsDrawing(true);
      setRenderTick((t) => t + 1);
      return;
    }
    if (mode === 'line') {
      startPointRef.current = point;
      setPreviewLine({ start: point, end: point });
      setIsDrawing(true);
      return;
    }

    if (mode === 'pan') {
      startPointRef.current = { x: event.clientX, y: event.clientY };
      setIsDrawing(true);
      return;
    }

    startPointRef.current = point;
    setIsDrawing(true);
    if (mode === 'brush' || mode === 'eraser') {
      pushUndo();
    }
    if (mode === 'rect' || mode === 'ellipse') {
      setPreviewShape({ type: mode, start: point, end: point });
    }
  };

  const handlePointerMove: React.PointerEventHandler<HTMLCanvasElement> = (event) => {
    if (!isDrawing) return;
    if (mode === 'pan') {
      if (!startPointRef.current) return;
      const dx = event.clientX - startPointRef.current.x;
      const dy = event.clientY - startPointRef.current.y;
      setPan((p) => ({ x: p.x + dx, y: p.y + dy }));
      startPointRef.current = { x: event.clientX, y: event.clientY };
      setRenderTick((t) => t + 1);
      return;
    }
    const point = toImageCoords(event.clientX, event.clientY);
    if (!point || !startPointRef.current) return;

    if (mode === 'pen' && penDragTarget) {
      setPenHandles((prev) => {
        const next = [...prev];
        const handles = next[penDragTarget.index] ?? {};
        const anchors = [...penPoints];
        const anchor = anchors[penDragTarget.index];
        if (!anchor) return prev;
        if (penDragTarget.type === 'anchor') {
          const dx = point.x - anchor.x;
          const dy = point.y - anchor.y;
          anchors[penDragTarget.index] = { x: point.x, y: point.y };
          if (handles.handleIn) handles.handleIn = { x: handles.handleIn.x + dx, y: handles.handleIn.y + dy };
          if (handles.handleOut) handles.handleOut = { x: handles.handleOut.x + dx, y: handles.handleOut.y + dy };
        } else if (penDragTarget.type === 'in') {
          handles.handleIn = point;
        } else if (penDragTarget.type === 'out') {
          handles.handleOut = point;
        }
        next[penDragTarget.index] = handles;
        setPenPoints(anchors);
        setRenderTick((t) => t + 1);
        return next;
      });
      return;
    }

    if (mode === 'brush' || mode === 'eraser') {
      drawLine(startPointRef.current, point, mode === 'eraser');
      startPointRef.current = point;
      setRenderTick((t) => t + 1);
    }
    if (mode === 'rect' || mode === 'ellipse') {
      const type = mode === 'rect' && shapeType === 'ellipse' ? 'ellipse' : mode;
      setPreviewShape({ type: type as 'rect' | 'ellipse', start: startPointRef.current, end: point });
    }
    if (mode === 'line') {
      setPreviewLine({ start: startPointRef.current, end: point });
    }
  };

  const handlePointerUp: React.PointerEventHandler<HTMLCanvasElement> = (event) => {
    if (!isDrawing) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    setIsDrawing(false);
    if (mode === 'pen' && penDragTarget) {
      setPenDragTarget(null);
      return;
    }
    const point = toImageCoords(event.clientX, event.clientY);
    if (!point || !startPointRef.current) {
      setPreviewShape(null);
      setPreviewLine(null);
      return;
    }

    if (mode === 'rect' || mode === 'ellipse') {
      pushUndo();
      const type = mode === 'rect' && shapeType === 'ellipse' ? 'ellipse' : mode;
      drawShape({ type: type as 'rect' | 'ellipse', start: startPointRef.current, end: point }, false);
      setPreviewShape(null);
      setRenderTick((t) => t + 1);
    }
    if (mode === 'line') {
      pushUndo();
      drawLine(startPointRef.current, point, false);
      setPreviewLine(null);
      setRenderTick((t) => t + 1);
    }
  };

  const handleWheel: React.WheelEventHandler<HTMLDivElement> = (event) => {
    if (event.deltaY === 0) return;
    event.preventDefault();
    const delta = event.deltaY > 0 ? -0.1 : 0.1;
    setScale((s) => Math.min(4, Math.max(0.5, s + delta)));
    setRenderTick((t) => t + 1);
  };

  const render = () => {
    const canvas = canvasRef.current;
    const mask = maskCanvasRef.current;
    const info = imageInfo;
    const baseImage = baseImageRef.current;
    if (!canvas || !mask || !info || !baseImage) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.fillStyle = 'rgba(14,18,34,0.75)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(centerOffset.x, centerOffset.y);
    ctx.scale(viewScale, viewScale);
    ctx.drawImage(baseImage, 0, 0, info.width, info.height);
    ctx.globalAlpha = 0.5;
    ctx.drawImage(mask, 0, 0, info.width, info.height);
    ctx.globalAlpha = 1;

    // 预览形状
    if (previewShape) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.lineWidth = 1 / viewScale;
      const { start, end } = previewShape;
      const x = Math.min(start.x, end.x);
      const y = Math.min(start.y, end.y);
      const w = Math.abs(end.x - start.x);
      const h = Math.abs(end.y - start.y);
      if (previewShape.type === 'rect') {
        ctx.strokeRect(x, y, w, h);
      } else {
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }
    if (previewLine) {
      ctx.save();
      ctx.strokeStyle = 'rgba(88,136,255,0.9)';
      ctx.lineWidth = brushSize / viewScale;
      ctx.beginPath();
      ctx.moveTo(previewLine.start.x, previewLine.start.y);
      ctx.lineTo(previewLine.end.x, previewLine.end.y);
      ctx.stroke();
      ctx.restore();
    }

    // 绘制钢笔路径预览和控制柄
    if (penPoints.length) {
      ctx.save();
      ctx.lineWidth = 1 / viewScale;
      ctx.strokeStyle = 'rgba(88,136,255,0.8)';
      ctx.fillStyle = 'rgba(88,136,255,0.25)';
      ctx.beginPath();
      ctx.moveTo(penPoints[0].x, penPoints[0].y);
      for (let i = 0; i < penPoints.length - 1; i++) {
        const p0 = penPoints[i];
        const p1 = penPoints[i + 1];
        const h0 = penHandles[i]?.handleOut ?? p0;
        const h1 = penHandles[i + 1]?.handleIn ?? p1;
        ctx.bezierCurveTo(h0.x, h0.y, h1.x, h1.y, p1.x, p1.y);
      }
      ctx.stroke();

      // 绘制控制柄和锚点
      for (let i = 0; i < penPoints.length; i++) {
        const anchor = penPoints[i];
        const handles = penHandles[i] || {};
        if (handles.handleIn) {
          ctx.strokeStyle = 'rgba(255,255,255,0.5)';
          ctx.beginPath();
          ctx.moveTo(anchor.x, anchor.y);
          ctx.lineTo(handles.handleIn.x, handles.handleIn.y);
          ctx.stroke();
          ctx.fillStyle = 'rgba(255,255,255,0.8)';
          ctx.beginPath();
          ctx.arc(handles.handleIn.x, handles.handleIn.y, 4 / viewScale, 0, Math.PI * 2);
          ctx.fill();
        }
        if (handles.handleOut) {
          ctx.strokeStyle = 'rgba(255,255,255,0.5)';
          ctx.beginPath();
          ctx.moveTo(anchor.x, anchor.y);
          ctx.lineTo(handles.handleOut.x, handles.handleOut.y);
          ctx.stroke();
          ctx.fillStyle = 'rgba(255,255,255,0.8)';
          ctx.beginPath();
          ctx.arc(handles.handleOut.x, handles.handleOut.y, 4 / viewScale, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(anchor.x, anchor.y, 5 / viewScale, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // 预览笔触
    if (penPoints.length) {
      ctx.save();
      ctx.strokeStyle = 'rgba(88,136,255,0.9)';
      ctx.fillStyle = 'rgba(88,136,255,0.25)';
      ctx.lineWidth = 2 / viewScale;
      ctx.beginPath();
      ctx.moveTo(penPoints[0].x, penPoints[0].y);
      penPoints.slice(1).forEach((p) => ctx.lineTo(p.x, p.y));
      ctx.stroke();
      penPoints.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4 / viewScale, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    }

    ctx.restore();
  };

  useEffect(() => {
    render();
  }, [renderTick, imageInfo, previewShape, penPoints, centerOffset, viewScale]);

  useEffect(() => {
    const updateSize = () => {
      const h = Math.min(640, Math.max(360, window.innerHeight - 240));
      const w = Math.min(960, Math.max(640, window.innerWidth - 320));
      setEditorHeight(h);
      setEditorWidth(w);
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const { clientWidth, clientHeight } = canvas;
      if (clientWidth && clientHeight) {
        canvas.width = clientWidth;
        canvas.height = clientHeight;
        setRenderTick((t) => t + 1);
      }
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  const exportMask = async () => {
    const mask = maskCanvasRef.current;
    if (!mask || !imageInfo) return;
    const helper = document.createElement('canvas');
    helper.width = imageInfo.width;
    helper.height = imageInfo.height;
    const ctx = helper.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(mask, 0, 0);
    const imageData = ctx.getImageData(0, 0, helper.width, helper.height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i + 3];
      if (alpha > 0) {
        data[i] = 255;
        data[i + 1] = 255;
        data[i + 2] = 255;
        data[i + 3] = 255;
      } else {
        data[i] = 0;
        data[i + 1] = 0;
        data[i + 2] = 0;
        data[i + 3] = 255;
      }
    }
    ctx.putImageData(imageData, 0, 0);
    helper.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], 'mask.png', { type: 'image/png' });
      onExport?.(file);
    }, 'image/png');
  };

  const toolButtons: Array<
    | { key: string; icon: React.ComponentType<any>; label: string; onClick?: () => void; mode?: Mode }
    | { key: 'divider' }
  > = [
    { key: 'undo', icon: RotateCcw, label: '撤销', onClick: restoreFromUndo },
    { key: 'reset', icon: RefreshCcw, label: '清空', onClick: clearMask, mode: undefined },
    { key: 'invert', icon: Circle, label: '反选', onClick: invertMask },
    { key: 'pan', icon: Hand, label: '移动', mode: 'pan' as Mode },
    { key: 'divider' },
    { key: 'pen', icon: PenLine, label: '钢笔', mode: 'pen' as Mode },
    { key: 'rect', icon: Square, label: '框选' },
    { key: 'brush-size', icon: Brush, label: `${brushSize}` },
    { key: 'brush', icon: Brush, label: '涂抹', mode: 'brush' as Mode },
    { key: 'eraser', icon: Eraser, label: '橡皮', mode: 'eraser' as Mode },
  ];

  return (
    <div className="flex flex-col gap-3 no-scrollbar overflow-y-auto">
      <div
        className="relative flex w-full items-center justify-center overflow-visible rounded-2xl border border-white/10"
        style={{
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          background: '#1A1B27',
          height: editorHeight,
        }}
        onWheel={handleWheel}
      >
        <div
          ref={toolbarRef}
          className="absolute left-4 top-1/2 z-10 flex w-[96px] -translate-y-1/2 flex-col gap-2 rounded-2xl bg-[rgb(42,42,42)] p-1.5 text-white shadow-lg overflow-visible relative"
          style={{ backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' }}
          onWheel={(e) => {
            // 防止工具栏滚轮触发画布缩放
            e.stopPropagation();
          }}
        >
          <div
            className="flex flex-col gap-2 overflow-y-auto no-scrollbar"
            style={{ maxHeight: editorHeight - 80 }}
          >
            {toolButtons.map((item) => {
              if (item.key === 'divider') {
                return <div key="divider" className="my-1 h-[2px] w-[70%] self-center rounded-full" style={{ background: '#676767' }} />;
              }
            const isActive = item.mode ? mode === item.mode : item.key === 'rect' ? mode === 'rect' : false;
            return (
              <Button
                key={item.key}
                ref={item.key === 'brush-size' ? brushSizeBtnRef : item.key === 'rect' ? shapeBtnRef : undefined}
                  variant={isActive ? 'secondary' : 'ghost'}
                  size="sm"
                  className={cn(
                    'flex h-8 w-full items-center justify-center gap-2 rounded-xl px-2 py-1.5 text-xs',
                    isActive ? 'bg-white/20 text-white' : 'bg-transparent text-white hover:bg-white/10 hover:text-white',
                  )}
                  onClick={(event) => {
                    if (item.onClick) item.onClick();
                    if (item.mode) {
                      setMode(item.mode);
                      setShowBrushSize(false);
                      setShowShapeMenu(false);
                    }
                    if (item.key === 'brush-size' && brushSizeBtnRef.current && toolbarRef.current) {
                      const rect = brushSizeBtnRef.current.getBoundingClientRect();
                      const parentRect = toolbarRef.current.getBoundingClientRect();
                      setBrushPopoverPos({
                        x: rect.right - parentRect.left + 8,
                        y: rect.top - parentRect.top + rect.height / 2,
                      });
                      setShowBrushSize((v) => !v);
                      setShowShapeMenu(false);
                    }
                    if (item.key === 'rect' && shapeBtnRef.current) {
                      const rect = shapeBtnRef.current.getBoundingClientRect();
                      const parentRect = toolbarRef.current?.getBoundingClientRect();
                      setShapeMenuPos({
                        x: parentRect ? rect.right - parentRect.left + 8 : rect.right + 8,
                        y: parentRect ? rect.top - parentRect.top + rect.height / 2 : rect.top + rect.height / 2,
                      });
                      setMode('rect'); // 默认保持可框选
                      setShowShapeMenu((v) => !v);
                      setShowBrushSize(false);
                    } else {
                      setShowShapeMenu(false);
                    }
                  }}
                >
                  <item.icon
                    className="h-4 w-4 text-white stroke-white"
                    style={{ stroke: '#FFFFFF', color: '#FFFFFF' }}
                  />
                  <span>{item.label}</span>
                </Button>
              );
            })}
          </div>
          {showBrushSize && (
            <div
              className="absolute z-20 rounded-lg bg-[rgb(42,42,42)] px-3 py-2 shadow-2xl"
              style={{
                left: brushPopoverPos.x,
                top: brushPopoverPos.y,
                transform: 'translateY(-50%)',
                backdropFilter: 'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
                minWidth: 180,
              }}
            >
              <div className="mb-2 flex items-center justify-between text-xs text-white/80">
                <span>画笔大小</span>
                <span>{brushSize}px</span>
              </div>
              <input
                type="range"
                min={4}
                max={160}
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-48"
              />
            </div>
          )}
          {showShapeMenu && (
            <div
              className="absolute z-40 rounded-lg bg-[rgb(42,42,42)] px-3 py-2 shadow-2xl"
              style={{
                left: shapeMenuPos.x,
                top: shapeMenuPos.y,
                transform: 'translateY(-50%)',
                backdropFilter: 'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
                minWidth: 96,
              }}
            >
              <div className="flex flex-col gap-2 text-xs text-white text-center">
                <button
                  type="button"
                  className="rounded-md px-2 py-1 hover:bg-white/10"
                  onClick={() => {
                    setShapeType('rect');
                    setMode('rect');
                    setShowShapeMenu(false);
                  }}
                >
                  矩形
                </button>
                <button
                  type="button"
                  className="rounded-md px-2 py-1 hover:bg-white/10"
                  onClick={() => {
                    setShapeType('ellipse');
                    setMode('rect');
                    setShowShapeMenu(false);
                  }}
                >
                  圆形
                </button>
              </div>
            </div>
          )}
        </div>

        <canvas
            ref={canvasRef}
            className="h-full w-full select-none"
            style={{
              maxHeight: editorHeight,
              maxWidth: editorWidth,
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          />
      </div>

      <div className="flex justify-end">
        <Button size="sm" onClick={exportMask}>
          生成遮罩
        </Button>
      </div>
    </div>
  );
};

export const MaskEditorDialog: React.FC<MaskEditorDialogProps> = ({
  open,
  onOpenChange,
  image,
  initMask,
  title = '编辑遮罩',
  onMaskGenerated,
}) => {
  const [imageSrc, setImageSrc] = useState<string | undefined>(undefined);
  const [initMaskSrc, setInitMaskSrc] = useState<string | undefined>(undefined);

  useEffect(() => {
    let revoke: string | undefined;
    const load = async () => {
      const url = await toDataUrl(image);
      setImageSrc(url);
      if (url && typeof image === 'object') {
        revoke = url;
      }
    };
    void load();
    return () => {
      if (revoke) URL.revokeObjectURL(revoke);
    };
  }, [image]);

  useEffect(() => {
    let revoke: string | undefined;
    const load = async () => {
      const url = await toDataUrl(initMask);
      setInitMaskSrc(url);
      if (url && typeof initMask === 'object') {
        revoke = url;
      }
    };
    void load();
    return () => {
      if (revoke) URL.revokeObjectURL(revoke);
    };
  }, [initMask]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'max-w-5xl border border-white/10 text-white shadow-2xl',
          'bg-[rgba(12,16,32,0.85)]',
        )}
        style={{
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-white">{title}</DialogTitle>
        </DialogHeader>
        <div className="max-h-[640px] overflow-y-auto no-scrollbar">
          {!imageSrc ? (
            <div className="flex h-[480px] items-center justify-center text-sm text-white/60">请先提供一张图片以编辑遮罩</div>
          ) : (
            <MaskCanvas imageSrc={imageSrc} initMaskSrc={initMaskSrc} onExport={onMaskGenerated} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
