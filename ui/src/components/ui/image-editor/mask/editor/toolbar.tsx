import React, { useRef, useState } from 'react';

import { useMemoizedFn, useThrottleEffect } from 'ahooks';
import type { EventEmitter } from 'ahooks/lib/useEventEmitter';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Brush,
  ChevronLeft,
  ChevronRight,
  CopyX,
  Eraser,
  Eye,
  EyeOff,
  Hand,
  ImageUp,
  PencilRuler,
  Save,
  SquareIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useControls } from 'react-zoom-pan-pinch';

import { Button } from '@/components/ui/button';
import { IVinesMaskEditorProps } from '@/components/ui/image-editor/mask/editor/hooks/use-vines-mask-editor.ts';
import { IMaskEditorEvent } from '@/components/ui/image-editor/mask/editor/index.tsx';
import { Separator } from '@/components/ui/separator.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useElementSize } from '@/hooks/use-resize-observer.ts';
import { cn } from '@/utils';

interface IMaskEditorToolbarProps {
  miniPreview: boolean;
  setMiniPreview: React.Dispatch<React.SetStateAction<boolean>>;

  editable: boolean;
  setEditable: React.Dispatch<React.SetStateAction<boolean>>;

  pointerMode: IVinesMaskEditorProps['pointerMode'];
  setPointerMode: React.Dispatch<React.SetStateAction<IVinesMaskEditorProps['pointerMode']>>;

  onFileInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;

  event$: EventEmitter<IMaskEditorEvent>;
  disabledSave?: boolean;

  children?: React.ReactNode;

  mini?: boolean;
}

export const MaskEditorToolbar: React.FC<IMaskEditorToolbarProps> = ({
  miniPreview,
  setMiniPreview,
  editable,
  setEditable,
  pointerMode,
  setPointerMode,
  onFileInputChange,
  event$,
  disabledSave,
  children,
  mini,
}) => {
  const { t } = useTranslation();
  const { zoomIn, zoomOut, resetTransform } = useControls();

  const { ref, width } = useElementSize();

  const [scrollToolVisible, setScrollToolVisible] = useState(false);
  useThrottleEffect(
    () => {
      if (width) {
        setScrollToolVisible(width < 416);
      }
    },
    [width],
    { wait: 100 },
  );

  const handleSelectLocalImage = useMemoizedFn(() => {
    const inputElement = document.createElement('input');
    inputElement.type = 'file';
    inputElement.accept = 'image/*';
    inputElement.onchange = (e) => {
      onFileInputChange(e as unknown as React.ChangeEvent<HTMLInputElement>);
    };
    inputElement.click();
  });

  const toolbarRef = useRef<HTMLDivElement | null>(null);

  return (
    <div ref={ref} className="relative flex w-full items-center">
      <div ref={toolbarRef} className="flex w-full overflow-hidden">
        <div
          className={cn(
            'flex w-full min-w-[26rem] items-center justify-between',
            scrollToolVisible && 'min-w-[34rem] pr-16',
          )}
        >
          <div className="flex items-center gap-2">
            {children}

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className="border-transparent !p-1 shadow-none"
                  variant="outline"
                  size="small"
                  icon={<ImageUp />}
                  onClick={handleSelectLocalImage}
                />
              </TooltipTrigger>
              <TooltipContent>{t('components.ui.vines-image-mask-editor.toolbar.select-image')}</TooltipContent>
            </Tooltip>
          </div>
          <div className={cn('flex items-center gap-2', !mini && '-ml-32')}>
            <div className="space-x-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    className="border-transparent !p-1 shadow-none"
                    variant="outline"
                    size="small"
                    icon={<ZoomInIcon />}
                    onClick={() => zoomIn()}
                  />
                </TooltipTrigger>
                <TooltipContent>{t('components.ui.vines-image-mask-editor.toolbar.zoom-in')}</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    className="border-transparent !p-1 shadow-none"
                    variant="outline"
                    size="small"
                    icon={<SquareIcon />}
                    onClick={() => resetTransform()}
                  />
                </TooltipTrigger>
                <TooltipContent>{t('components.ui.vines-image-mask-editor.toolbar.fit-view')}</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    className="border-transparent !p-1 shadow-none"
                    variant="outline"
                    size="small"
                    icon={<ZoomOutIcon />}
                    onClick={() => zoomOut()}
                  />
                </TooltipTrigger>
                <TooltipContent>{t('components.ui.vines-image-mask-editor.toolbar.zoom-out')}</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    className="border-transparent !p-1 shadow-none"
                    variant="outline"
                    size="small"
                    icon={editable ? <PencilRuler /> : <Hand />}
                    onClick={() => setEditable(!editable)}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  {editable
                    ? t('components.ui.vines-image-mask-editor.toolbar.editable')
                    : t('components.ui.vines-image-mask-editor.toolbar.move')}
                </TooltipContent>
              </Tooltip>
            </div>
            <Separator className="h-4" orientation="vertical" />
            <div className="space-x-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    className={cn('!p-1', pointerMode !== 'brush' && 'border-transparent shadow-none')}
                    variant="outline"
                    size="small"
                    icon={<Brush />}
                    onClick={() => setPointerMode('brush')}
                  />
                </TooltipTrigger>
                <TooltipContent>{t('components.ui.vines-image-mask-editor.toolbar.brush')}</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    className={cn('!p-1', pointerMode !== 'eraser' && 'border-transparent shadow-none')}
                    variant="outline"
                    size="small"
                    icon={<Eraser />}
                    onClick={() => setPointerMode('eraser')}
                  />
                </TooltipTrigger>
                <TooltipContent>{t('components.ui.vines-image-mask-editor.toolbar.eraser')}</TooltipContent>
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
                <TooltipContent>{t('components.ui.vines-image-mask-editor.toolbar.clear')}</TooltipContent>
              </Tooltip>
            </div>
            <Separator className="h-4" orientation="vertical" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className="border-transparent !p-1 shadow-none"
                  variant="outline"
                  size="small"
                  icon={miniPreview ? <Eye /> : <EyeOff />}
                  onClick={() => setMiniPreview(!miniPreview)}
                />
              </TooltipTrigger>
              <TooltipContent>
                {t('components.ui.vines-image-mask-editor.toolbar.preview.label', {
                  status: miniPreview
                    ? t('components.ui.vines-image-mask-editor.toolbar.preview.open')
                    : t('components.ui.vines-image-mask-editor.toolbar.preview.close'),
                })}
              </TooltipContent>
            </Tooltip>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="border-transparent !p-1 shadow-none"
                variant="outline"
                size="small"
                icon={<Save />}
                disabled={disabledSave}
                onClick={() => event$.emit('save')}
              />
            </TooltipTrigger>
            <TooltipContent>{t('components.ui.vines-image-mask-editor.toolbar.save')}</TooltipContent>
          </Tooltip>
        </div>
      </div>
      <AnimatePresence>
        {scrollToolVisible && (
          <motion.div
            key="vines-workspace-scrollTool"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute right-0 z-50 flex h-full items-center gap-1 bg-slate-1 pl-1"
          >
            <div className="pointer-events-none absolute -left-6 h-full w-8 bg-gradient-to-l from-slate-1 from-30%" />
            <Button
              icon={<ChevronLeft size={16} />}
              variant="outline"
              className="z-10 !p-1 [&_svg]:!size-3"
              onClick={() => toolbarRef.current?.scrollBy({ left: -100, behavior: 'smooth' })}
            />
            <Button
              icon={<ChevronRight size={12} />}
              variant="outline"
              className="z-10 !p-1 [&_svg]:!size-3"
              onClick={() => toolbarRef.current?.scrollBy({ left: 100, behavior: 'smooth' })}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
