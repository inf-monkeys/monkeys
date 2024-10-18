import React from 'react';

import { Brush, Eraser, Frame } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { IVinesMaskEditorProps } from '@/components/ui/image-editor/mask/editor/hooks/use-vines-mask-editor.ts';
import { Separator } from '@/components/ui/separator.tsx';
import { Slider } from '@/components/ui/slider.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/utils';

interface IBrushBarProps {
  pointerMode: IVinesMaskEditorProps['pointerMode'];

  brushSize: IVinesMaskEditorProps['brushSize'];
  setBrushSize: React.Dispatch<React.SetStateAction<IVinesMaskEditorProps['brushSize']>>;

  brushType: IVinesMaskEditorProps['brushType'];
  setBrushType: React.Dispatch<React.SetStateAction<IVinesMaskEditorProps['brushType']>>;
}

export const BrushBar: React.FC<IBrushBarProps> = ({
  pointerMode,
  brushSize = 12,
  setBrushSize,
  brushType,
  setBrushType,
}) => {
  const { t } = useTranslation();

  const isUseNormalBrush = brushType === 'normal';
  return (
    <div className="absolute bottom-1 left-1 z-20 -m-6 !-mb-2 flex scale-75 items-center justify-center gap-2 rounded border border-input bg-background px-2 py-1 opacity-70 transition-opacity hover:opacity-100">
      {pointerMode === 'brush' ? <Brush size={14} /> : <Eraser size={14} />}
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
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            className={cn('!p-1', isUseNormalBrush && 'border-transparent shadow-none')}
            variant="outline"
            size="small"
            icon={<Frame />}
            onClick={() => setBrushType(isUseNormalBrush ? 'rectangle' : 'normal')}
          />
        </TooltipTrigger>
        <TooltipContent>{t('components.ui.vines-image-mask-editor.brush-bar.rectangle')}</TooltipContent>
      </Tooltip>
    </div>
  );
};
