import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';

import { useMemoizedFn, useSetState } from 'ahooks';
import type { EventEmitter } from 'ahooks/lib/useEventEmitter';
import { useTranslation } from 'react-i18next';
import { useControls } from 'react-zoom-pan-pinch';
import { toast } from 'sonner';

import {
  IVinesMaskEditorProps,
  useVinesMaskEditor,
} from '@/components/ui/image-editor/mask/editor/hooks/use-vines-mask-editor.ts';
import { applyMaskToNewCanvas, canvasToBlob } from '@/components/ui/image-editor/mask/editor/utils.ts';
import { cn } from '@/utils';

export type IMaskEditorEvent = 'clear-mask' | 'save';

export interface IMaskEditorProps extends Pick<React.ComponentPropsWithoutRef<'div'>, 'onMouseDown' | 'onMouseUp'> {
  src: string;

  initialSize?: { w: number; h: number };
  pointerMode?: IVinesMaskEditorProps['pointerMode'];
  brushType?: IVinesMaskEditorProps['brushType'];
  brushSize?: IVinesMaskEditorProps['brushSize'];

  disabled?: boolean;
  setCenterScale?: React.Dispatch<React.SetStateAction<number>>;

  setPreviewImage?: React.Dispatch<React.SetStateAction<string | null>>;
  setMaskFileBlob?: React.Dispatch<React.SetStateAction<Blob | null>>;

  event$?: EventEmitter<IMaskEditorEvent>;
}

export const MaskEditor: React.FC<IMaskEditorProps> = ({
  src,
  disabled,
  setCenterScale,
  initialSize,
  setPreviewImage,
  setMaskFileBlob,
  pointerMode = 'brush',
  brushType = 'normal',
  brushSize,
  event$,
  ...props
}) => {
  const { t } = useTranslation();

  const { centerView, instance } = useControls();

  const [size, setSize] = useSetState<{ w: number; h: number }>(initialSize ?? { w: 256, h: 256 });

  const canvas = useRef<HTMLCanvasElement | null>(null);
  const maskCanvas = useRef<HTMLCanvasElement | null>(null);
  const cursorCanvas = useRef<HTMLCanvasElement | null>(null);
  const tempMaskCanvas = useRef<HTMLCanvasElement | null>(null);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
  const [maskContext, setMaskContext] = useState<CanvasRenderingContext2D | null>(null);

  useLayoutEffect(() => {
    if (canvas.current && !context) {
      const ctx = (canvas.current as HTMLCanvasElement).getContext('2d');
      setContext(ctx);
    }
  }, [canvas]);

  useLayoutEffect(() => {
    if (maskCanvas.current && !context) {
      const ctx = (maskCanvas.current as HTMLCanvasElement).getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, size.w, size.h);
        setMaskContext(ctx);
      }
    }
  }, [context]);

  useEffect(() => {
    if (src && context) {
      const img = new Image();
      img.onload = () => {
        setSize({ w: img.width, h: img.height });
        requestIdleCallback(() => {
          context.drawImage(img, 0, 0);
          const centerScale = (instance.wrapperComponent?.getBoundingClientRect()?.height ?? 185) / img.height - 0.05;
          setCenterScale?.(centerScale);
          centerView(centerScale);
        });
      };
      img.src = src;
    }
  }, [src, context]);

  const handleGenerateMaskImage = useMemoizedFn(async () => {
    if (!context || !maskContext) return;

    const newCanvas = applyMaskToNewCanvas(size.w, size.h, context, maskContext);

    const newBlob = await canvasToBlob(newCanvas, 'image/png', 0.6);

    if (!newBlob) {
      toast.error(t('components.ui.vines-image-mask-editor.failed-to-gen-mask'));
      return;
    }

    setMaskFileBlob?.(newBlob);
    setPreviewImage?.(URL.createObjectURL(newBlob));
  });

  const { onPointerMove, onPointerDown, onPointerUp, onPointerLeave, handleCleanMask } = useVinesMaskEditor({
    maskCanvasRef: maskCanvas,
    cursorCanvasRef: cursorCanvas,
    tempMaskCanvasRef: tempMaskCanvas,
    brushType,
    pointerMode,
    brushSize,
    onDrawEnd: handleGenerateMaskImage,
  });

  event$?.useSubscription((trigger) => {
    switch (trigger) {
      case 'clear-mask':
        handleCleanMask();
    }
  });

  return (
    <div
      className={cn('bg-transparent-grid relative rounded', disabled && 'pointer-events-none')}
      onMouseLeave={onPointerLeave}
      {...props}
    >
      <canvas
        ref={canvas}
        className="pointer-events-none"
        style={{
          width: size.w,
          height: size.h,
        }}
        width={size.w}
        height={size.h}
      />
      <canvas
        ref={cursorCanvas}
        className="absolute left-0 top-0 z-10"
        style={{
          width: size.w,
          height: size.h,
        }}
        width={size.w}
        height={size.h}
      />
      <canvas
        className="absolute left-0 top-0 z-20"
        ref={maskCanvas}
        style={{
          width: size.w,
          height: size.h,
        }}
        width={size.w}
        height={size.h}
      />
      <canvas
        ref={tempMaskCanvas}
        className="absolute left-0 top-0 z-30"
        style={{
          width: size.w,
          height: size.h,
        }}
        width={size.w}
        height={size.h}
        onPointerMove={onPointerMove}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerLeave}
      />
    </div>
  );
};
