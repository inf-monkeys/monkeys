import React, { useRef } from 'react';

import type { EventEmitter } from 'ahooks/lib/useEventEmitter';
import {
  Brush,
  CopyX,
  Eraser,
  Eye,
  EyeOff,
  Fullscreen,
  Hand,
  ImageUp,
  PencilRuler,
  Save,
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

  children?: React.ReactNode;
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
  children,
}) => {
  const { t } = useTranslation();
  const { zoomIn, zoomOut, resetTransform } = useControls();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="flex w-full items-center justify-between">
      <div className="flex items-center gap-2">
        <input ref={fileInputRef} className="hidden" type="file" accept="image/*" onChange={onFileInputChange} />
        {children}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="border-transparent !p-1 shadow-none"
              variant="outline"
              size="small"
              icon={<ImageUp />}
              onClick={() => fileInputRef.current?.click()}
            />
          </TooltipTrigger>
          <TooltipContent>{t('components.ui.vines-image-mask-editor.toolbar.select-image')}</TooltipContent>
        </Tooltip>
      </div>
      <div className="flex items-center gap-2">
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
                icon={<Fullscreen />}
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
            onClick={() => event$.emit('save')}
          />
        </TooltipTrigger>
        <TooltipContent>{t('components.ui.vines-image-mask-editor.toolbar.save')}</TooltipContent>
      </Tooltip>
    </div>
  );
};
