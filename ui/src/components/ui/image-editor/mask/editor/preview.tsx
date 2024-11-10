import React, { useRef, useState } from 'react';

import { useLongPress } from 'ahooks';
import { motion } from 'framer-motion';
import { Contrast, Eye, EyeOff, ScanSearch, ZoomInIcon, ZoomOutIcon } from 'lucide-react';
import Image from 'rc-image';
import { useTranslation } from 'react-i18next';
import { useControls } from 'react-zoom-pan-pinch';

import { Button } from '@/components/ui/button';
import { useVinesImageManage } from '@/components/ui/image/use-vines-image-manage.tsx';
import { Separator } from '@/components/ui/separator.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/utils';

interface IMaskPreviewProps {
  src: string;

  contrast: boolean;
  setContrast: React.Dispatch<React.SetStateAction<boolean>>;

  mini?: boolean;
}

export const MaskPreview: React.FC<IMaskPreviewProps> = ({ src, contrast, setContrast, mini }) => {
  const { t } = useTranslation();

  const [miniPreview, setMiniPreview] = useState(true);

  const { icons, closeIcon } = useVinesImageManage();
  const { zoomIn, zoomOut, resetTransform } = useControls();

  const contrastBtnRef = useRef<HTMLButtonElement>(null);

  useLongPress(() => setContrast(true), contrastBtnRef, {
    onLongPressEnd: () => setContrast(false),
    delay: 0,
  });

  return (
    <div
      className={cn('absolute bottom-1 right-1 space-y-1', mini && '-m-5 scale-75', miniPreview && mini && '!-mb-3')}
    >
      <motion.div
        key="vines-mask-editor-preview"
        className={cn(
          'flex h-24 overflow-hidden rounded border border-input bg-background transition-opacity hover:!opacity-100 [&>div]:mx-auto',
          !miniPreview && 'pointer-events-none',
        )}
        initial={{ opacity: 0 }}
        animate={{ opacity: miniPreview ? 0.85 : 0, height: miniPreview ? 96 : 0 }}
      >
        <Image
          src={src}
          preview={{
            icons,
            closeIcon,
            mask: <Eye className="stroke-white" />,
          }}
        />
      </motion.div>
      <div className="flex w-full items-center gap-1 rounded border border-input bg-background p-1 opacity-85 transition-opacity hover:opacity-100">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="border-transparent !p-1 shadow-none"
              variant="outline"
              size="small"
              icon={<Contrast className={cn(contrast && '-scale-x-100')} />}
              ref={contrastBtnRef}
            />
          </TooltipTrigger>
          <TooltipContent>{t('components.ui.vines-image-mask-editor.toolbar.contrast')}</TooltipContent>
        </Tooltip>
        <Separator className="h-4" orientation="vertical" />
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
              icon={<ScanSearch />}
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
    </div>
  );
};
