import React, { ChangeEventHandler, PointerEventHandler, useEffect, useRef, useState } from 'react';

import { FileWithPath } from '@mantine/dropzone';
import * as png from '@stevebel/png';
import { COLOR_TYPES } from '@stevebel/png/lib/helpers/color-types';
import Metadata from '@stevebel/png/lib/helpers/metadata';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { VinesUpdater } from '@/components/ui/updater';
import { cn } from '@/utils';

interface IVinesImageMaskEditorProps extends React.ComponentPropsWithoutRef<'div'> {
  defaultImage?: string;
  onFinished?: (urls: string[]) => void;
}

export const VinesImageMaskEditor: React.FC<IVinesImageMaskEditorProps> = ({ children, defaultImage, onFinished }) => {
  const { t } = useTranslation();

  const [visible, setVisible] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const canvasDivRef = useRef<HTMLDivElement | null>(null);
  const imgCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [brushSize, setBrushSize] = useState(5);
  const [opacity, setOpacity] = useState(50);

  const [canvasVisible, setCanvasVisible] = useState(false);

  const [fileList, setFileList] = useState<FileWithPath[]>([]);

  let drawMode = false;
  let lastX = 0;
  let lastY = 0;
  let originFile: File | null;
  let rawFile: ArrayBuffer | null;

  useEffect(() => {
    maskCanvasRef.current && (maskCanvasRef.current.style.opacity = (opacity / 100).toString());
  }, [opacity]);

  useEffect(() => {
    maskCanvasRef.current && (maskCanvasRef.current.style.mixBlendMode = 'initial');
    maskCanvasRef.current && (maskCanvasRef.current.style.opacity = (opacity / 100).toString());
  }, []);

  const getMaskFillStyle = () => 'rgb(0, 0, 0)';

  const getCanvasBlob: (canvas: HTMLCanvasElement) => Promise<Blob | null> = (canvas) =>
    new Promise((resolve) => canvas.toBlob(resolve));

  const maskPointerMoveHandler: PointerEventHandler<HTMLCanvasElement> = (event) => {
    if (!maskCanvasRef.current) return;

    const editorCtx = maskCanvasRef.current.getContext('2d')!;

    const leftButtonDown = (window.TouchEvent && event instanceof TouchEvent) || event.buttons == 1;
    const rightButtonDown = [2, 5, 32].includes(event.buttons);

    if (!event.altKey && leftButtonDown) {
      event.preventDefault();
      const x = event.nativeEvent.offsetX;
      const y = event.nativeEvent.offsetY;
      if (!drawMode)
        requestAnimationFrame(() => {
          editorCtx.beginPath();
          editorCtx.fillStyle = getMaskFillStyle();
          editorCtx.globalCompositeOperation = 'source-over';
          editorCtx.arc(x, y, brushSize, 0, Math.PI * 2, false);
          editorCtx.fill();
        });
      else
        requestAnimationFrame(() => {
          editorCtx.beginPath();
          editorCtx.fillStyle = getMaskFillStyle();
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
    } else if ((event.altKey && leftButtonDown) || rightButtonDown) {
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

    const editorCtx = maskCanvasRef.current.getContext('2d')!;

    if ([0, 2, 5].includes(event.button)) {
      drawMode = true;

      event.preventDefault();

      const x = event.nativeEvent.offsetX;
      const y = event.nativeEvent.offsetY;

      editorCtx.beginPath();
      if (!event.altKey && event.button == 0) {
        editorCtx.fillStyle = getMaskFillStyle();
        editorCtx.globalCompositeOperation = 'source-over';
      } else {
        editorCtx.globalCompositeOperation = 'destination-out';
      }
      editorCtx.arc(x, y, brushSize, 0, Math.PI * 2, false);
      editorCtx.fill();

      lastX = x;
      lastY = y;
    }
  };

  const saveHandler = async () => {
    if (!imgCanvasRef.current || !maskCanvasRef.current) return;

    if (!originFile) {
      toast.error(t('components.ui.vines-image-mask-editor.toast.no-file'));
      return;
    }

    const rawMetadata = png.decode(
      rawFile ? rawFile : await (await getCanvasBlob(imgCanvasRef.current!)!)!.arrayBuffer(),
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

    // FileSaver.saveAs(new Blob([newPng], { type: 'image/png' }), 'test.png');
    // const url = URL.createObjectURL(new Blob([newPng], { type: 'image/png' }));

    const extIndex = originFile.name.lastIndexOf('.');
    const newName = (extIndex === -1 ? originFile.name : originFile.name.substring(0, extIndex)) + '.png';
    const newBlob = new Blob([newPng], { type: 'image/png' });
    const newFile = new File([newBlob], newName, { type: 'image/png' });
    setFileList([newFile]);
    toast.success(t('common.operate.success'));
  };

  const fileInputHandler: ChangeEventHandler<HTMLInputElement> = async (event) => {
    if (!event.target.files || event.target.files.length === 0 || !maskCanvasRef.current || !imgCanvasRef.current)
      return;

    const file = event.target.files[0];

    if (!file) return;

    originFile = file;

    const imgCtx = imgCanvasRef.current.getContext('2d');

    const imgArrayBuffer = await file.arrayBuffer();

    rawFile = file.name.split('.').pop()?.toLowerCase() != 'png' ? null : imgArrayBuffer;

    const image = new Image();
    image.onload = () => {
      setCanvasVisible(true);
      canvasDivRef.current!.style.width = `${image.width}px`;
      canvasDivRef.current!.style.height = `${image.height}px`;
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

    const imgBlob = new Blob([imgArrayBuffer], { type: file.type });
    image.src = URL.createObjectURL(imgBlob);
  };

  return (
    <Dialog open={visible} onOpenChange={setVisible}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="w-auto min-w-[400px] !max-w-[95vw]">
        <DialogTitle>{t('components.ui.vines-image-mask-editor.title')}</DialogTitle>

        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                fileInputRef.current!.click();
              }}
            >
              {t('components.ui.vines-image-mask-editor.operate.select-image')}
            </Button>
            <input
              id="image_file"
              type="file"
              className="hidden"
              ref={fileInputRef}
              accept="image/*"
              onChange={fileInputHandler}
            />
          </div>

          <div ref={canvasDivRef}>
            <canvas
              ref={imgCanvasRef}
              className={cn('absolute', {
                hidden: !canvasVisible,
              })}
            ></canvas>
            <canvas
              ref={maskCanvasRef}
              onPointerMove={maskPointerMoveHandler}
              onPointerDown={maskPointerDownHandler}
              className={cn('absolute', {
                hidden: !canvasVisible,
              })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={saveHandler}>
            {t('common.utils.save')}
          </Button>
          <VinesUpdater limit={1} files={fileList} onFinished={onFinished}>
            <Button variant="outline">{t('common.utils.upload')}</Button>
          </VinesUpdater>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
