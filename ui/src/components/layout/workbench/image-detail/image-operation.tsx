import { Download, FlipHorizontal, FlipVertical, RotateCcw, RotateCw, ZoomIn, ZoomOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
interface ImageOperationsProps {
  // imageUrl?: string;
  imageRotation: number;
  imageFlipX: boolean;
  imageFlipY: boolean;
  imageScale: number;
  onRotateLeft: () => void;
  onRotateRight: () => void;
  onFlipHorizontal: () => void;
  onFlipVertical: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onDownload: () => void;
}

export const ImageOperations: React.FC<ImageOperationsProps> = ({
  // imageUrl,
  onRotateLeft,
  onRotateRight,
  onFlipHorizontal,
  onFlipVertical,
  onZoomIn,
  onZoomOut,
  onDownload,
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex w-full items-center justify-center gap-2 bg-background dark:bg-[#111113]">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button icon={<FlipVertical />} variant="outline" size="small" onClick={onFlipVertical} />
        </TooltipTrigger>
        <TooltipContent>{t('workspace.image-detail.flipY', '垂直翻转')}</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button icon={<FlipHorizontal />} variant="outline" size="small" onClick={onFlipHorizontal} />
        </TooltipTrigger>
        <TooltipContent>{t('workspace.image-detail.flipX', '水平翻转')}</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button icon={<RotateCcw />} variant="outline" size="small" onClick={onRotateLeft} />
        </TooltipTrigger>
        <TooltipContent>{t('workspace.image-detail.rotateLeft', '向左旋转')}</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button icon={<RotateCw />} variant="outline" size="small" onClick={onRotateRight} />
        </TooltipTrigger>
        <TooltipContent>{t('workspace.image-detail.rotateRight', '向右旋转')}</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button icon={<ZoomIn />} variant="outline" size="small" onClick={onZoomIn} />
        </TooltipTrigger>
        <TooltipContent>{t('workspace.image-detail.zoomIn', '放大')}</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button icon={<ZoomOut />} variant="outline" size="small" onClick={onZoomOut} />
        </TooltipTrigger>
        <TooltipContent>{t('workspace.image-detail.zoomOut', '缩小')}</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button icon={<Download />} variant="outline" size="small" onClick={onDownload} />
        </TooltipTrigger>
        <TooltipContent>{t('workspace.image-detail.download', '下载')}</TooltipContent>
      </Tooltip>
    </div>
  );
};
