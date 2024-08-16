import React, { ChangeEventHandler, PointerEventHandler, useEffect, useRef, useState } from 'react';

import * as png from '@stevebel/png';
import { COLOR_TYPES } from '@stevebel/png/lib/helpers/color-types';
import Metadata from '@stevebel/png/lib/helpers/metadata';
import type { EventEmitter } from 'ahooks/lib/useEventEmitter';
import Compressor from 'compressorjs';
import { useTranslation } from 'react-i18next';
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch';
import { toast } from 'sonner';

import { FileWithPathWritable, IPointerMode } from '@/components/ui/image-mask-editor/typings.ts';
import { cn } from '@/utils';
import VinesEvent from '@/utils/events.ts';

export type IImageMaskEditorCanvasEvent = 'trigger-reselect-file' | 'trigger-save' | 'trigger-clear-mask';

interface IImageMaskEditorCanvasProps {
  className?: string;
  maxWidth?: number;

  pointerMode: IPointerMode;
  maskColor: string;
  brushSize: number;
  opacity: number;

  quality?: number;
  onBeforeExport?: () => void; // 准备导出图片前的回调
  onBeforeSave?: () => void;
  onFinished?: (urls: string[]) => void;

  event$: EventEmitter<IImageMaskEditorCanvasEvent>;
}

export const ImageMaskEditorCanvas: React.FC<IImageMaskEditorCanvasProps> = ({
  className,
  maxWidth,
  pointerMode,
  maskColor,
  brushSize,
  opacity,
  quality = 0.6,
  onBeforeExport,
  onBeforeSave,
  onFinished,
  event$,
}) => {
  const { t } = useTranslation();

  const brushPreviewDivRef = useRef<HTMLDivElement | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const canvasDivRef = useRef<HTMLDivElement | null>(null);
  const imgCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [image, setImage] = useState(new Image());

  const [canvasVisible, setCanvasVisible] = useState(false);

  let drawMode = false;
  let lastX = 0;
  let lastY = 0;

  useEffect(() => {
    maskCanvasRef.current && (maskCanvasRef.current.style.opacity = (opacity / 100).toString());
  }, [opacity]);

  useEffect(() => {
    setTimeout(() => {
      fileInputRef.current && (fileInputRef.current.value = '');
      drawMode = false;
      lastX = 0;
      lastY = 0;
    }, 80);
  }, []);

  const setCanvasDivSize = () => {
    if (!canvasDivRef.current) return;
    canvasDivRef.current.style.width = image.width + 'px';
    canvasDivRef.current.style.height = image.height + 'px';
  };

  const getCanvasBlob: (canvas: HTMLCanvasElement) => Promise<Blob | null> = (canvas) =>
    new Promise((resolve) => canvas.toBlob(resolve));

  const maskPointerMoveHandler: PointerEventHandler<HTMLCanvasElement> = (event) => {
    if (!maskCanvasRef.current) return;

    const editorCtx = maskCanvasRef.current.getContext('2d')!;

    if (brushPreviewDivRef.current) {
      // update preview
      const cursorX = event.nativeEvent.offsetX;
      const cursorY = event.nativeEvent.offsetY;
      brushPreviewDivRef.current.style.width = brushSize * 2 + 'px';
      brushPreviewDivRef.current.style.height = brushSize * 2 + 'px';
      brushPreviewDivRef.current.style.left = cursorX - brushSize + 'px';
      brushPreviewDivRef.current.style.top = cursorY - brushSize + 'px';
    }

    const leftButtonDown = (window.TouchEvent && event instanceof TouchEvent) || event.buttons == 1;
    const rightButtonDown = [2, 5, 32].includes(event.buttons);

    if (!event.altKey && pointerMode == 'brush' && leftButtonDown) {
      event.preventDefault();
      const x = event.nativeEvent.offsetX;
      const y = event.nativeEvent.offsetY;
      if (!drawMode)
        requestAnimationFrame(() => {
          editorCtx.beginPath();
          editorCtx.fillStyle = maskColor;
          editorCtx.globalCompositeOperation = 'source-over';
          editorCtx.arc(x, y, brushSize, 0, Math.PI * 2, false);
          editorCtx.fill();
        });
      else
        requestAnimationFrame(() => {
          editorCtx.beginPath();
          editorCtx.fillStyle = maskColor;
          editorCtx.globalCompositeOperation = 'source-over';

          const dx = x - lastX;
          const dy = y - lastY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const directionX = dx / distance;
          const directionY = dy / distance;

          for (let i = 0; i < distance; i += 5) {
            const px = lastX + directionX * i;
            const py = lastY + directionY * i;
            editorCtx.arc(px, py, brushSize, 0, Math.PI * 2, false);
            editorCtx.fill();
          }
          lastX = x;
          lastY = y;
        });
    } else if (((event.altKey || pointerMode == 'eraser') && leftButtonDown) || rightButtonDown) {
      event.preventDefault();
      const x = event.nativeEvent.offsetX;
      const y = event.nativeEvent.offsetY;
      if (!drawMode)
        requestAnimationFrame(() => {
          editorCtx.beginPath();
          editorCtx.globalCompositeOperation = 'destination-out';
          editorCtx.arc(x, y, brushSize, 0, Math.PI * 2, false);
          editorCtx.fill();
          lastX = x;
          lastY = y;
        });
      else
        requestAnimationFrame(() => {
          editorCtx.beginPath();
          editorCtx.globalCompositeOperation = 'destination-out';

          const dx = x - lastX;
          const dy = y - lastY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const directionX = dx / distance;
          const directionY = dy / distance;

          for (let i = 0; i < distance; i += 5) {
            const px = lastX + directionX * i;
            const py = lastY + directionY * i;
            editorCtx.arc(px, py, brushSize, 0, Math.PI * 2, false);
            editorCtx.fill();
          }
          lastX = x;
          lastY = y;
        });
    }
  };

  const maskPointerDownHandler: PointerEventHandler<HTMLCanvasElement> = (event) => {
    if (!maskCanvasRef.current) return;

    const maskCtx = maskCanvasRef.current.getContext('2d')!;

    if ([0, 2, 5].includes(event.button)) {
      drawMode = true;

      event.preventDefault();

      const x = event.nativeEvent.offsetX;
      const y = event.nativeEvent.offsetY;

      maskCtx.beginPath();
      if (!event.altKey && pointerMode == 'brush' && event.button == 0) {
        maskCtx.fillStyle = maskColor;
        maskCtx.globalCompositeOperation = 'source-over';
      } else {
        maskCtx.globalCompositeOperation = 'destination-out';
      }
      maskCtx.arc(x, y, brushSize, 0, Math.PI * 2, false);
      maskCtx.fill();

      lastX = x;
      lastY = y;
    }
  };

  const maskPointerOverHandler: PointerEventHandler<HTMLCanvasElement> = () => {
    brushPreviewDivRef.current && (brushPreviewDivRef.current.style.display = 'block');
  };
  const maskPointerLeaveHandler: PointerEventHandler<HTMLCanvasElement> = () => {
    brushPreviewDivRef.current && (brushPreviewDivRef.current.style.display = 'none');
  };

  const clearHandler = () => {
    if (!maskCanvasRef.current) return;
    const maskCtx = maskCanvasRef.current.getContext('2d')!;
    maskCtx.clearRect(0, 0, maskCtx.canvas.width, maskCtx.canvas.height);
  };

  const saveHandler = async () => {
    if (!imgCanvasRef.current || !maskCanvasRef.current) return;

    if (!fileInputRef.current?.files?.[0]) {
      toast.error(t('components.ui.vines-image-mask-editor.toast.no-file'));
      return;
    }

    onBeforeExport?.();

    const originFile = fileInputRef.current.files[0];
    const imgArrayBuffer = await originFile.arrayBuffer();

    const rawMetadata = png.decode(
      originFile.name.split('.').pop()?.toLowerCase() == 'png'
        ? imgArrayBuffer
        : await (await getCanvasBlob(imgCanvasRef.current!))!.arrayBuffer(),
    );
    const maskBlob = (await getCanvasBlob(maskCanvasRef.current))!;
    const maskMetadata = png.decode(await maskBlob.arrayBuffer());

    const newData = rawMetadata.data;

    for (let i = 0; i < rawMetadata.data.length; i += 4) {
      if (maskMetadata.data[i + 3]) newData[i + 3] = 0;
    }

    const newMetadata: Metadata = {
      ...rawMetadata,
      colorType: COLOR_TYPES.TRUE_COLOR_WITH_ALPHA,
      data: newData,
    };

    const newPng = png.encode(newMetadata);
    const extIndex = originFile.name.lastIndexOf('.');
    const newName = `${extIndex === -1 ? originFile.name : originFile.name.substring(0, extIndex)}_mask-edited_${+new Date()}.png`;

    const newBlob = new Blob([newPng], { type: 'image/png' });
    const newFile = new File([newBlob], newName, { type: 'image/png' }) as FileWithPathWritable;
    newFile.path = newName;

    new Compressor(newFile, {
      quality,

      success(result) {
        onBeforeSave?.();

        VinesEvent.emit('vines-uploader', [result], (urls: string[]) => {
          onFinished?.(urls);
          toast.success(t('common.operate.success'));
        });
      },

      error(error: Error) {
        console.error(error);
        toast.error(t('common.operate.error'));
      },
    });
  };

  const fileInputHandler: ChangeEventHandler<HTMLInputElement> = async (event) => {
    if (!event.target.files || event.target.files.length === 0 || !maskCanvasRef.current || !imgCanvasRef.current)
      return;

    maskCanvasRef.current && (maskCanvasRef.current.style.opacity = (opacity / 100).toString());
    maskCanvasRef.current && (maskCanvasRef.current.style.mixBlendMode = 'multiply');

    const file = event.target.files[0];

    if (!file) return;

    const imgCtx = imgCanvasRef.current.getContext('2d');

    const imgArrayBuffer = await file.arrayBuffer();

    const imgBlob = new Blob([imgArrayBuffer], { type: file.type });
    setImage((img) => {
      image.onload = () => {
        setCanvasVisible(true);
        canvasDivRef.current && setCanvasDivSize();
        maskCanvasRef.current!.width = image.width;
        maskCanvasRef.current!.height = image.height;
        maskCanvasRef.current!.style.width = `${image.width}px`;
        maskCanvasRef.current!.style.height = `${image.height}px`;
        imgCanvasRef.current!.width = image.width;
        imgCanvasRef.current!.height = image.height;
        imgCanvasRef.current!.style.width = `${image.width}px`;
        imgCanvasRef.current!.style.height = `${image.height}px`;
        imgCtx!.drawImage(image, 0, 0);
      };
      img.src = URL.createObjectURL(imgBlob);
      return img;
    });
  };

  event$.useSubscription((mode) => {
    switch (mode) {
      case 'trigger-reselect-file':
        fileInputRef.current?.click();
        break;
      case 'trigger-save':
        void saveHandler();
        break;
      case 'trigger-clear-mask':
        clearHandler();
    }
  });

  return (
    <TransformWrapper minScale={0.01} maxScale={20} initialScale={0.2} centerOnInit>
      <div
        className={cn('h-96 w-[40rem] overflow-hidden rounded-lg bg-slate-2 shadow', className)}
        style={{ maxWidth: `${maxWidth}px` }}
      >
        <input type="file" accept="image/*" onChange={fileInputHandler} ref={fileInputRef} className="hidden" />
        <TransformComponent wrapperClass="max-h-full max-w-full">
          <div ref={canvasDivRef}>
            <div
              ref={brushPreviewDivRef}
              id="brush-preview"
              style={{
                backgroundColor: 'transparent',
                outline: '1px dashed black',
                boxShadow: '0 0 0 1px white',
                borderRadius: '50%',
                position: 'absolute',
                zIndex: 9999,
                pointerEvents: 'none',
              }}
            />
            <canvas
              ref={imgCanvasRef}
              className={cn('absolute', {
                hidden: !canvasVisible,
              })}
            />
            <canvas
              ref={maskCanvasRef}
              onPointerMove={pointerMode != 'move' ? maskPointerMoveHandler : undefined}
              onPointerDown={pointerMode != 'move' ? maskPointerDownHandler : undefined}
              onPointerOver={pointerMode != 'move' ? maskPointerOverHandler : undefined}
              onPointerLeave={pointerMode != 'move' ? maskPointerLeaveHandler : undefined}
              className={cn('absolute', {
                hidden: !canvasVisible,
              })}
            />
          </div>
        </TransformComponent>
      </div>
    </TransformWrapper>
  );
};
