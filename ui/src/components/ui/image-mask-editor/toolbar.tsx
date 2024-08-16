import React from 'react';

import type { EventEmitter } from 'ahooks/lib/useEventEmitter';
import { Brush, CircleEllipsisIcon, Eraser, Move, Trash } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { IImageMaskEditorCanvasEvent } from '@/components/ui/image-mask-editor/canvas.tsx';
import { COLOR_LIST } from '@/components/ui/image-mask-editor/consts.ts';
import { IPointerMode } from '@/components/ui/image-mask-editor/typings.ts';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.tsx';
import { Slider } from '@/components/ui/slider.tsx';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { getI18nContent } from '@/utils';

interface IImageMaskEditorToolbarProps {
  pointerMode: IPointerMode;
  setPointerMode: React.Dispatch<React.SetStateAction<IPointerMode>>;
  maskColor: string;
  setMaskColor: React.Dispatch<React.SetStateAction<string>>;
  brushSize: number;
  setBrushSize: React.Dispatch<React.SetStateAction<number>>;
  opacity: number;
  setOpacity: React.Dispatch<React.SetStateAction<number>>;

  event$: EventEmitter<IImageMaskEditorCanvasEvent>;

  enableMini?: boolean;
}

export const ImageMaskEditorToolbar: React.FC<IImageMaskEditorToolbarProps> = ({
  enableMini,
  pointerMode,
  setPointerMode,
  maskColor,
  setMaskColor,
  brushSize,
  setBrushSize,
  opacity,
  setOpacity,
  event$,
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex gap-2">
      <ToggleGroup
        type="single"
        size="sm"
        variant="outline"
        value={pointerMode}
        onValueChange={(v) => setPointerMode(v as IPointerMode)}
      >
        <ToggleGroupItem value="brush">
          <Tooltip>
            <TooltipTrigger asChild>
              <Brush className="h-4 w-4" />
            </TooltipTrigger>
            <TooltipContent>{t('components.ui.vines-image-mask-editor.toolbar.brush')}</TooltipContent>
          </Tooltip>
        </ToggleGroupItem>
        <ToggleGroupItem value="eraser">
          <Tooltip>
            <TooltipTrigger asChild>
              <Eraser className="h-4 w-4" />
            </TooltipTrigger>
            <TooltipContent>{t('components.ui.vines-image-mask-editor.toolbar.eraser')}</TooltipContent>
          </Tooltip>
        </ToggleGroupItem>
        <ToggleGroupItem value="move">
          <Tooltip>
            <TooltipTrigger asChild>
              <Move className="h-4 w-4" />
            </TooltipTrigger>
            <TooltipContent>{t('components.ui.vines-image-mask-editor.toolbar.move')}</TooltipContent>
          </Tooltip>
        </ToggleGroupItem>
      </ToggleGroup>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              event$.emit('trigger-clear-mask');
            }}
            icon={<Trash className="h-4 w-4" />}
          />
        </TooltipTrigger>
        <TooltipContent>{t('components.ui.vines-image-mask-editor.toolbar.clear')}</TooltipContent>
      </Tooltip>
      <Select value={maskColor} onValueChange={setMaskColor}>
        <Tooltip>
          <TooltipTrigger asChild>
            <SelectTrigger>
              <SelectValue placeholder={t('components.ui.vines-image-mask-editor.operate.mask-color.placeholder')} />
            </SelectTrigger>
          </TooltipTrigger>
          <TooltipContent>{t('components.ui.vines-image-mask-editor.toolbar.brush-color')}</TooltipContent>
        </Tooltip>
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
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <Button variant="outline" size="small" icon={<CircleEllipsisIcon />} />
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent>{t('components.ui.vines-image-mask-editor.toolbar.more')}</TooltipContent>
          </Tooltip>
          <PopoverContent className="flex flex-col gap-4">
            <Slider
              label={t('components.ui.vines-image-mask-editor.label.brush-size')}
              className="w-full"
              min={1}
              max={72}
              step={1}
              value={[brushSize]}
              onValueChange={(v) => setBrushSize(v[0])}
            />
            <Slider
              label={t('components.ui.vines-image-mask-editor.label.opacity')}
              className="w-full"
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
  );
};
