import React, { ChangeEventHandler, memo, PointerEventHandler, useEffect, useRef, useState } from 'react';

import * as png from '@stevebel/png';
import { COLOR_TYPES } from '@stevebel/png/lib/helpers/color-types';
import Metadata from '@stevebel/png/lib/helpers/metadata';
import { useEventEmitter } from 'ahooks';
import type { EventEmitter } from 'ahooks/lib/useEventEmitter';
import Compressor from 'compressorjs';
import { Brush, CircleEllipsisIcon, Eraser, Info, Move, Trash } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { COLOR_LIST } from '@/components/ui/image-mask-editor/consts.ts';
import { FileWithPathWritable, IPointerMode } from '@/components/ui/image-mask-editor/typings.ts';
import { Kbd } from '@/components/ui/kbd';
import { kbdWindowsKeysMap } from '@/components/ui/kbd/typings.ts';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.tsx';
import { Slider } from '@/components/ui/slider.tsx';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group.tsx';
import { cn, getI18nContent } from '@/utils';
import VinesEvent from '@/utils/events.ts';

export type IImageMaskEditorEvent = 'trigger-reselect-file' | 'trigger-save';

export interface IImageMaskEditorProps {
  defaultImage?: string;

  onBeforeExport?: () => void; // 准备导出图片前的回调

  onBeforeSave?: () => void;
  onFinished?: (urls: string[]) => void;

  event$: EventEmitter<IImageMaskEditorEvent>;

  quality?: number;

  className?: string;
  style?: React.CSSProperties;
  tipsEnabled?: boolean;

  enableMini?: boolean;
}

export const ImageMaskEditor: React.FC<IImageMaskEditorProps> = memo(
  ({
    className,
    style,
    defaultImage,
    onBeforeExport,
    onBeforeSave,
    onFinished,
    event$,
    quality = 0.6,
    tipsEnabled = true,
    enableMini = false,
  }) => {
    const { t } = useTranslation();

    const brushPreviewDivRef = useRef<HTMLDivElement | null>(null);

    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const canvasDivRef = useRef<HTMLDivElement | null>(null);
    const imgCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);

    const [image, setImage] = useState(new Image());

    const [pointerMode, setPointerMode] = useState<IPointerMode>('brush');
    const [maskColor, setMaskColor] = useState('rgb(0,0,0)');
    const [brushSize, setBrushSize] = useState(12);
    const [opacity, setOpacity] = useState(50);

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

    const maskPointerOverHandler: PointerEventHandler<HTMLCanvasElement> = (event) => {
      brushPreviewDivRef.current && (brushPreviewDivRef.current.style.display = 'block');
    };
    const maskPointerLeaveHandler: PointerEventHandler<HTMLCanvasElement> = (event) => {
      brushPreviewDivRef.current && (brushPreviewDivRef.current.style.display = 'none');
    };

    const clearHandler = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      e.preventDefault();
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

          VinesEvent.emit('vines-updater', [result], (urls: string[]) => {
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
      }
    });

    return (
      <div className="flex flex-col gap-3">
        <input type="file" accept="image/*" onChange={fileInputHandler} ref={fileInputRef} className="hidden" />
        {tipsEnabled && (
          <div className="flex items-center gap-2 rounded-md border border-input p-2 shadow-sm">
            <Info size={14} />
            <span className="flex gap-1 text-xs text-opacity-70">
              {t('components.ui.vines-image-mask-editor.tip-1')}
              <Kbd keys={kbdWindowsKeysMap.option} />
              {t('components.ui.vines-image-mask-editor.tip-2')}
            </span>
          </div>
        )}
        <div className="flex gap-4">
          <ToggleGroup
            type="single"
            size="sm"
            variant="outline"
            value={pointerMode}
            onValueChange={(v) => setPointerMode(v as IPointerMode)}
          >
            <ToggleGroupItem value="brush">
              <Brush className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="eraser">
              <Eraser className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="move">
              <Move className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
          <Button variant="outline" onClick={clearHandler}>
            <Trash className="h-4 w-4" />
          </Button>
          <Select value={maskColor} onValueChange={setMaskColor}>
            <SelectTrigger>
              <SelectValue placeholder={t('components.ui.vines-image-mask-editor.operate.mask-color.placeholder')} />
            </SelectTrigger>
            <SelectContent>
              {COLOR_LIST.map(({ value, label }, i) => (
                <SelectItem key={i} value={value}>
                  {getI18nContent(label)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {enableMini ? (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" icon={<CircleEllipsisIcon />} />
              </PopoverTrigger>
              <PopoverContent className="flex flex-col gap-4">
                <Slider
                  label={t('components.ui.vines-image-mask-editor.label.brush-size')}
                  className="w-32"
                  min={1}
                  max={72}
                  step={1}
                  value={[brushSize]}
                  onValueChange={(v) => setBrushSize(v[0])}
                />
                <Slider
                  label={t('components.ui.vines-image-mask-editor.label.opacity')}
                  className="w-32"
                  min={1}
                  max={100}
                  step={1}
                  value={[opacity]}
                  onValueChange={(v) => setOpacity(v[0])}
                />
              </PopoverContent>
            </Popover>
          ) : (
            <>
              <Slider
                label={t('components.ui.vines-image-mask-editor.label.brush-size')}
                className="w-32"
                min={1}
                max={72}
                step={1}
                value={[brushSize]}
                onValueChange={(v) => setBrushSize(v[0])}
              />
              <Slider
                label={t('components.ui.vines-image-mask-editor.label.opacity')}
                className="w-32"
                min={1}
                max={100}
                step={1}
                value={[opacity]}
                onValueChange={(v) => setOpacity(v[0])}
              />
            </>
          )}
        </div>

        <div className={cn('h-96 w-[40rem] overflow-hidden rounded-lg bg-slate-2 shadow', className)} style={style}>
          <TransformWrapper minScale={0.01} maxScale={20} initialScale={0.2} centerOnInit>
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
          </TransformWrapper>
        </div>
      </div>
    );
  },
);

ImageMaskEditor.displayName = 'ImageMaskEditor';

type IVinesImageMaskEditorProps = Omit<IImageMaskEditorProps, 'event$'> & {
  children: React.ReactNode;
};

export const VinesImageMaskEditor: React.FC<IVinesImageMaskEditorProps> = ({ children, ...attr }) => {
  const { t } = useTranslation();

  const maskEditor$ = useEventEmitter<IImageMaskEditorEvent>();

  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  return (
    <Dialog open={visible} onOpenChange={setVisible}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="w-auto min-w-[400px] !max-w-[calc(100vw-20px)]">
        <DialogTitle>{t('components.ui.vines-image-mask-editor.title')}</DialogTitle>
        <ImageMaskEditor
          event$={maskEditor$}
          onBeforeSave={() => {
            setLoading(false);
            setVisible(false);
          }}
          onBeforeExport={() => setLoading(true)}
          {...attr}
        />
        <DialogFooter>
          <div className="flex w-full justify-between">
            <Button variant="outline" onClick={() => maskEditor$.emit('trigger-reselect-file')}>
              {t('components.ui.vines-image-mask-editor.operate.select-image')}
            </Button>
            <Button variant="outline" onClick={() => maskEditor$.emit('trigger-save')} loading={loading}>
              {t('common.utils.save')}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
