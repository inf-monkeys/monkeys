import React, { useState } from 'react';

import type { EventEmitter } from 'ahooks/lib/useEventEmitter';
import { AnimatePresence, motion } from 'framer-motion';
import { Brush, CopyX, Eraser, Frame, Lasso, Redo2, Undo2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { IVinesMaskEditorProps } from '@/components/ui/image-editor/mask/editor/hooks/use-vines-mask-editor.ts';
import { IMaskEditorEvent } from '@/components/ui/image-editor/mask/editor/index.tsx';
import { Separator } from '@/components/ui/separator.tsx';
import { Slider } from '@/components/ui/slider.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/utils';

interface IBrushBarProps {
  brushSize: IVinesMaskEditorProps['brushSize'];
  setBrushSize: React.Dispatch<React.SetStateAction<IVinesMaskEditorProps['brushSize']>>;

  pointerMode: IVinesMaskEditorProps['pointerMode'];
  setPointerMode: React.Dispatch<React.SetStateAction<IVinesMaskEditorProps['pointerMode']>>;

  brushType: IVinesMaskEditorProps['brushType'];
  setBrushType: React.Dispatch<React.SetStateAction<IVinesMaskEditorProps['brushType']>>;

  canUndo: boolean;
  canRedo: boolean;

  event$: EventEmitter<IMaskEditorEvent>;
}

export const BrushBar: React.FC<IBrushBarProps> = ({
  pointerMode,
  setPointerMode,
  brushSize = 12,
  setBrushSize,
  brushType,
  setBrushType,
  canUndo,
  canRedo,
  event$,
}) => {
  const { t } = useTranslation();

  const isUseNormalBrush = brushType === 'normal';
  const isUseRectangleBrush = brushType === 'rectangle';
  const isUseLassoBrush = brushType === 'lasso';

  const isUseBrush = pointerMode === 'brush';

  const [auxiliaryBrushSizeVisible, setAuxiliaryBrushSizeVisible] = useState(false);

  const displayBrushSize = brushSize * 2;

  return (
    <>
      <div className="absolute bottom-10 left-1 flex flex-col items-center gap-1 rounded border border-input bg-dialog p-1 opacity-85 transition-opacity hover:opacity-100">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className={cn('border-transparent !p-1.5 shadow-none', isUseNormalBrush && 'border-input')}
              variant="outline"
              size="small"
              icon={<Brush size={14} />}
              onClick={() => setBrushType('normal')}
            />
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>
            {t('components.ui.vines-image-mask-editor.brush-bar.brush')}
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className={cn('border-transparent !p-1.5 shadow-none', isUseRectangleBrush && 'border-input')}
              variant="outline"
              size="small"
              icon={<Frame size={14} />}
              onClick={() => setBrushType('rectangle')}
            />
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>
            {t('components.ui.vines-image-mask-editor.brush-bar.rectangle')}
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className={cn('border-transparent !p-1.5 shadow-none', isUseLassoBrush && 'border-input')}
              variant="outline"
              size="small"
              icon={<Lasso size={14} />}
              onClick={() => setBrushType('lasso')}
            />
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>
            {t('components.ui.vines-image-mask-editor.brush-bar.lasso')}
          </TooltipContent>
        </Tooltip>

        <Separator className="w-[80%]" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className={cn('border-transparent !p-1.5 shadow-none', !isUseBrush && 'border-input')}
              variant="outline"
              size="small"
              icon={<Eraser size={14} />}
              onClick={() => setPointerMode(isUseBrush ? 'eraser' : 'brush')}
            />
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>
            {t('components.ui.vines-image-mask-editor.brush-bar.eraser')}
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="border-transparent !p-1 shadow-none"
              variant="outline"
              size="small"
              icon={<CopyX />}
              onClick={() => event$.emit('clear-mask')}
            />
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>
            {t('components.ui.vines-image-mask-editor.toolbar.clear')}
          </TooltipContent>
        </Tooltip>

        <Separator className="w-[80%]" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="border-transparent !p-1 shadow-none"
              variant="outline"
              size="small"
              icon={<Undo2 />}
              disabled={!canUndo}
              onClick={() => event$.emit('undo')}
            />
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>
            {t('components.ui.vines-image-mask-editor.brush-bar.undo')}
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="border-transparent !p-1 shadow-none"
              variant="outline"
              size="small"
              icon={<Redo2 />}
              disabled={!canRedo}
              onClick={() => event$.emit('redo')}
            />
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>
            {t('components.ui.vines-image-mask-editor.brush-bar.redo')}
          </TooltipContent>
        </Tooltip>
      </div>
      <div
        className="absolute bottom-1 left-1 flex items-center justify-center gap-2 rounded border border-input bg-dialog p-2 opacity-85 transition-opacity hover:opacity-100"
        onFocus={() => isUseNormalBrush && setAuxiliaryBrushSizeVisible(true)}
        onBlur={() => setAuxiliaryBrushSizeVisible(false)}
      >
        {isUseBrush ? (
          isUseNormalBrush ? (
            <Brush size={14} />
          ) : isUseRectangleBrush ? (
            <Frame size={14} />
          ) : (
            <Lasso size={14} />
          )
        ) : (
          <Eraser size={14} />
        )}
        <span className="select-none text-xs">
          {isUseBrush
            ? isUseNormalBrush
              ? t('components.ui.vines-image-mask-editor.brush-bar.brush')
              : isUseRectangleBrush
                ? t('components.ui.vines-image-mask-editor.brush-bar.rectangle')
                : t('components.ui.vines-image-mask-editor.brush-bar.lasso')
            : t('components.ui.vines-image-mask-editor.brush-bar.eraser')}
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
      </div>
      <AnimatePresence>
        {auxiliaryBrushSizeVisible && (
          <motion.div
            className="vines-center absolute left-0 top-0 z-20 size-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setAuxiliaryBrushSizeVisible(false)}
          >
            <div
              className="rounded-full bg-black outline outline-2 outline-offset-2 outline-vines-500"
              style={{ width: displayBrushSize, height: displayBrushSize }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
