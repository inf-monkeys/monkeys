import React, { memo, useState } from 'react';

import { useEventEmitter } from 'ahooks';
import type { EventEmitter } from 'ahooks/lib/useEventEmitter';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { IImageMaskEditorCanvasEvent, ImageMaskEditorCanvas } from '@/components/ui/image-mask-editor/canvas.tsx';
import { ImageMaskEditorToolbar } from '@/components/ui/image-mask-editor/toolbar.tsx';
import { IPointerMode } from '@/components/ui/image-mask-editor/typings.ts';
import { cn } from '@/utils';

export type IImageMaskEditorEvent = 'trigger-select-image';

export interface IImageMaskEditorProps {
  onBeforeExport?: () => void; // 准备导出图片前的回调

  onBeforeSave?: () => void;
  onFinished?: (urls: string[]) => void;

  quality?: number;

  className?: string;
  children?: React.ReactNode;
  maxWidth?: number;

  enableMini?: boolean;

  event$?: EventEmitter<IImageMaskEditorEvent>;
}

export const ImageMaskEditor: React.FC<IImageMaskEditorProps> = memo(
  ({
    className,
    children,
    maxWidth = 562,
    onBeforeExport,
    onBeforeSave,
    onFinished,
    quality = 0.6,
    enableMini = false,
    event$,
  }) => {
    const { t } = useTranslation();

    const [pointerMode, setPointerMode] = useState<IPointerMode>('brush');
    const [maskColor, setMaskColor] = useState('rgb(0,0,0)');
    const [brushSize, setBrushSize] = useState(12);
    const [opacity, setOpacity] = useState(50);

    const [loading, setLoading] = useState(false);

    const maskEditorCanvas$ = useEventEmitter<IImageMaskEditorCanvasEvent>();

    const handleSelectImage = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      e.preventDefault();
      maskEditorCanvas$.emit('trigger-reselect-file');
    };

    const handleSave = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      e.preventDefault();
      setLoading(true);
      maskEditorCanvas$.emit('trigger-save');
    };

    event$?.useSubscription((mode) => {
      switch (mode) {
        case 'trigger-select-image':
          maskEditorCanvas$.emit('trigger-reselect-file');
          break;
      }
    });

    return (
      <div className={cn('flex flex-col gap-3', loading && 'pointer-events-none')}>
        <ImageMaskEditorToolbar
          pointerMode={pointerMode}
          setPointerMode={setPointerMode}
          maskColor={maskColor}
          setMaskColor={setMaskColor}
          brushSize={brushSize}
          setBrushSize={setBrushSize}
          opacity={opacity}
          setOpacity={setOpacity}
          enableMini={enableMini}
          event$={maskEditorCanvas$}
        />

        <ImageMaskEditorCanvas
          pointerMode={pointerMode}
          maskColor={maskColor}
          brushSize={brushSize}
          opacity={opacity}
          className={className}
          maxWidth={maxWidth}
          quality={quality}
          onBeforeExport={onBeforeExport}
          onBeforeSave={onBeforeSave}
          onFinished={(urls) => {
            setLoading(false);
            onFinished?.(urls);
          }}
          event$={maskEditorCanvas$}
        />

        <div className="flex w-full items-center justify-between">
          <Button variant="outline" size="small" onClick={handleSelectImage} disabled={loading}>
            {t('components.ui.vines-image-mask-editor.operate.select-image')}
          </Button>
          <div className="vines-center gap-2">
            {children}
            <Button variant="outline" size="small" onClick={handleSave} loading={loading}>
              {t('common.utils.save')}
            </Button>
          </div>
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

  const [visible, setVisible] = useState(false);

  return (
    <Dialog open={visible} onOpenChange={setVisible}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="w-auto min-w-[400px] !max-w-[calc(100vw-20px)]">
        <DialogTitle>{t('components.ui.vines-image-mask-editor.title')}</DialogTitle>
        <ImageMaskEditor onBeforeSave={() => setVisible(false)} {...attr} />
      </DialogContent>
    </Dialog>
  );
};
