import React from 'react';

import {
  ChevronLeft,
  ChevronRight,
  FlipHorizontal,
  FlipVertical,
  RotateCcw,
  RotateCw,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { ToolButton } from '@/components/layout/workspace/vines-view/flow/toolbar/tool-button.tsx';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export const useVinesImageManage = () => {
  const { t } = useTranslation();

  return {
    icons: {
      left: (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button icon={<ChevronLeft />} variant="outline" size="small" />
          </TooltipTrigger>
          <TooltipContent>{t('components.ui.image-preview.left')}</TooltipContent>
        </Tooltip>
      ),
      right: (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button icon={<ChevronRight />} variant="outline" size="small" />
          </TooltipTrigger>
          <TooltipContent>{t('components.ui.image-preview.right')}</TooltipContent>
        </Tooltip>
      ),

      flipX: <ToolButton icon={<FlipHorizontal />} tip={t('components.ui.image-preview.flipX')} side="top" />,
      flipY: <ToolButton icon={<FlipVertical />} tip={t('components.ui.image-preview.flipY')} side="top" />,
      rotateLeft: <ToolButton icon={<RotateCcw />} tip={t('components.ui.image-preview.rotateLeft')} side="top" />,
      rotateRight: <ToolButton icon={<RotateCw />} tip={t('components.ui.image-preview.rotateRight')} side="top" />,
      zoomOut: <ToolButton icon={<ZoomOut />} tip={t('components.ui.image-preview.zoomOut')} side="top" />,
      zoomIn: <ToolButton icon={<ZoomIn />} tip={t('components.ui.image-preview.zoomIn')} side="top" />,
    },
    closeIcon: (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button icon={<X />} variant="outline" size="small" />
        </TooltipTrigger>
        <TooltipContent>{t('components.ui.image-preview.close')}</TooltipContent>
      </Tooltip>
    ),
  };
};
