import React from 'react';

import { Brush, Eraser, Frame } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { IVinesMaskEditorProps } from '@/components/ui/image-editor/mask/editor/hooks/use-vines-mask-editor.ts';
import { Separator } from '@/components/ui/separator.tsx';
import { Slider } from '@/components/ui/slider.tsx';
import { cn } from '@/utils';

interface IBrushBarProps {
  pointerMode: IVinesMaskEditorProps['pointerMode'];

  brushSize: IVinesMaskEditorProps['brushSize'];
  setBrushSize: React.Dispatch<React.SetStateAction<IVinesMaskEditorProps['brushSize']>>;

  brushType: IVinesMaskEditorProps['brushType'];
  setBrushType: React.Dispatch<React.SetStateAction<IVinesMaskEditorProps['brushType']>>;

  mini?: boolean;
}

export const BrushBar: React.FC<IBrushBarProps> = ({
  pointerMode,
  brushSize = 12,
  setBrushSize,
  brushType,
  setBrushType,
  mini,
}) => {
  const { t } = useTranslation();

  const isUseNormalBrush = brushType === 'normal';
  const isUseBrush = pointerMode === 'brush';

  return (
    <div
      className={cn(
        'absolute bottom-1 left-1 z-20 flex items-center justify-center gap-2 rounded border border-input bg-background px-2 py-1 opacity-70 transition-opacity hover:opacity-100',
        mini && ' -m-6 !-mb-2 scale-75',
      )}
    >
      {isUseBrush ? isUseNormalBrush ? <Brush size={14} /> : <Frame size={14} /> : <Eraser size={14} />}
      <span className="text-xs">
        {isUseBrush
          ? isUseNormalBrush
            ? t('components.ui.vines-image-mask-editor.toolbar.brush')
            : t('components.ui.vines-image-mask-editor.toolbar.rectangle')
          : t('components.ui.vines-image-mask-editor.toolbar.eraser')}
      </span>
      {isUseNormalBrush && (
        <Slider
          className="w-24"
          min={1}
          max={72}
          step={1}
          value={[brushSize]}
          onValueChange={(v) => setBrushSize(v[0])}
          disabledLabel
        />
      )}
      <Separator orientation="vertical" className="h-4" />
      <Button
        className={cn('border-transparent !px-1.5 !py-1 shadow-none')}
        variant="outline"
        size="small"
        icon={isUseNormalBrush ? <Frame size={14} /> : <Brush size={14} />}
        onClick={() => setBrushType(isUseNormalBrush ? 'rectangle' : 'normal')}
      >
        {isUseNormalBrush
          ? t('components.ui.vines-image-mask-editor.brush-bar.rectangle')
          : t('components.ui.vines-image-mask-editor.brush-bar.brush')}
      </Button>
    </div>
  );
};
