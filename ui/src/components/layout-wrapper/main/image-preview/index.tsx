import React, { startTransition, useCallback, useEffect, useState } from 'react';

import { TrashIcon, X } from 'lucide-react';
import Image from 'rc-image';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useCustomConfigs } from '@/apis/authz/team/custom-configs';
import { deleteWorkflowExecution } from '@/apis/workflow/execution';
import { ImageOperations } from '@/components/layout/workbench/image-detail/image-operation';
import { RightSidebar } from '@/components/layout/workbench/image-detail/right-side-bar';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/utils';

import { Carousel } from './carousel';

import 'rc-image/assets/index.css';

export interface ImagePreviewProps {
  images: Array<{
    render?: {
      data: string;
      key?: string;
      origin: string;
    };
    instanceId: string;
  }>;
  position: number;
  onPositionChange: (position: number) => void;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
  hasPrev: boolean;
  hasNext: boolean;
  className?: string;
  children?: React.ReactNode;
  open: boolean;
  setOpen: (open: boolean) => void;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({
  images,
  position,
  onPositionChange,
  onNext,
  onPrev,
  onClose,
  hasPrev,
  hasNext,
  className,
  children,
  open,
  setOpen,
}) => {
  const { t } = useTranslation();

  const { imagePreviewOperationBarStyle } = useCustomConfigs();

  const [imageRotation, setImageRotation] = useState(0);
  const [imageFlipX, setImageFlipX] = useState(false);
  const [imageFlipY, setImageFlipY] = useState(false);
  const [imageScale, setImageScale] = useState(1);

  const currentImage = images[position];

  const imageUrl = currentImage?.render?.data;
  const imageOrigin = currentImage?.render?.origin;
  const instanceId = currentImage?.instanceId;

  const nonUrgentNextImage = useCallback(() => {
    startTransition(() => {
      onNext();
    });
  }, [onNext]);

  const nonUrgentPrevImage = useCallback(() => {
    startTransition(() => {
      onPrev();
    });
  }, [onPrev]);

  // Memoized image operation callbacks
  const handleRotateLeft = useCallback(() => {
    setImageRotation((prev) => prev - 90);
  }, []);

  const handleRotateRight = useCallback(() => {
    setImageRotation((prev) => prev + 90);
  }, []);

  const handleFlipHorizontal = useCallback(() => {
    setImageFlipX((prev) => !prev);
  }, []);

  const handleFlipVertical = useCallback(() => {
    setImageFlipY((prev) => !prev);
  }, []);

  const handleZoomIn = useCallback(() => {
    setImageScale((prev) => prev + 0.1);
  }, []);

  const handleZoomOut = useCallback(() => {
    setImageScale((prev) => Math.max(0.1, prev - 0.1));
  }, []);

  const handleDownload = useCallback(() => {
    if (imageUrl) {
      try {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.setAttribute('download', '');
        link.setAttribute('rel', 'noreferrer');
        link.click();
      } catch (error) {
        // do nothing
      }
    }
  }, [imageUrl]);

  useEffect(() => {
    const controller = new AbortController();
    document.body.addEventListener(
      'keydown',
      (e) => {
        if (e.key === 'ArrowUp') {
          nonUrgentPrevImage();
        } else if (e.key === 'ArrowDown') {
          nonUrgentNextImage();
        } else if (e.key === 'ArrowLeft') {
          nonUrgentPrevImage();
        } else if (e.key === 'ArrowRight') {
          nonUrgentNextImage();
        } else if (e.key === 'Escape') {
          onClose();
        }
      },
      {
        signal: controller.signal,
      },
    );
    return () => {
      controller.abort();
    };
  }, [nonUrgentPrevImage, nonUrgentNextImage, onClose]);

  // 监听图片状态变化，更新图片样式
  useEffect(() => {
    // 获取图片元素
    const imgElement = document.querySelector('.rc-image img') as HTMLElement;
    if (imgElement) {
      // 应用旋转、翻转和缩放效果
      imgElement.style.transform = `
        rotate(${imageRotation}deg)
        scaleX(${imageFlipX ? -1 : 1})
        scaleY(${imageFlipY ? -1 : 1})
        scale(${imageScale})
      `;
      imgElement.style.transition = 'transform 0.3s ease';
    }
  }, [imageRotation, imageFlipX, imageFlipY, imageScale]);

  // 处理删除图片
  const handleDeleteImage = useCallback(() => {
    if (instanceId) {
      toast.promise(deleteWorkflowExecution(instanceId), {
        success: () => {
          onClose();
          return t('common.delete.success');
        },
        error: t('common.delete.error'),
        loading: t('common.delete.loading'),
      });
    } else {
      onClose();
      toast.success(t('common.delete.success'));
    }
  }, [instanceId, onClose, t]);

  return (
    <>
      <div onClick={() => setOpen(!open)}>{children}</div>
      {open && (
        <div className={cn('fixed inset-0 z-[301] flex h-full w-full gap-global bg-neocard p-global', className)}>
          {/* 主内容区域 */}
          <main
            className={cn(
              `flex size-full flex-1 justify-center rounded-lg border border-input bg-slate-1 p-global dark:bg-[#111113]`,
            )}
          >
            {/* 左侧图片展示区 */}
            <div
              className={cn('flex h-full w-full flex-col items-center justify-between overflow-auto dark:bg-[#111113]')}
            >
              {imageUrl ? (
                <>
                  <div className="flex w-full flex-1 items-center justify-center">
                    <div className="vines-center size-full overflow-auto">
                      <Image
                        src={imageOrigin}
                        fallback={imageUrl}
                        alt="详情图片"
                        className="rounded-lg"
                        style={{
                          display: 'block',
                          margin: 'auto',
                          maxWidth: '100%',
                          width: 'auto',
                          height: 'auto',
                          objectFit: 'contain',
                          maxHeight: 'calc(100vh - 340px)',
                          transition: 'transform 0.3s ease',
                        }}
                      />
                    </div>
                  </div>
                  {/* 图片操作按钮 - 中间 */}
                  <div className="flex w-full flex-col gap-global overflow-hidden">
                    <ImageOperations
                      imageRotation={imageRotation}
                      imageFlipX={imageFlipX}
                      imageFlipY={imageFlipY}
                      imageScale={imageScale}
                      onRotateLeft={handleRotateLeft}
                      onRotateRight={handleRotateRight}
                      onFlipHorizontal={handleFlipHorizontal}
                      onFlipVertical={handleFlipVertical}
                      onZoomIn={handleZoomIn}
                      onZoomOut={handleZoomOut}
                      onDownload={handleDownload}
                    />
                    {/* 图片缩略图轮播 - 底部 */}
                    <div
                      className={cn(
                        'w-full',
                        imagePreviewOperationBarStyle === 'normal' &&
                          'max-w-[calc(100vw-(var(--global-spacing)*7)-var(--operation-bar-width))]',
                      )}
                    >
                      <Carousel
                        images={images}
                        position={position}
                        onPositionChange={(newPosition) => {
                          onPositionChange(newPosition);
                        }}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="vines-center size-full text-center text-3xl text-muted-foreground">
                  {t('workspace.image-detail.no-image')}
                </div>
              )}
            </div>

            {/* 右上角 absolute toolbar */}
            {imagePreviewOperationBarStyle === 'simple' && (
              <div className="absolute right-global-2 top-global-2 flex gap-global">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button icon={<TrashIcon />} variant="outline" onClick={handleDeleteImage} />
                  </TooltipTrigger>
                  <TooltipContent>{t('workspace.image-detail.delete')}</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button icon={<X />} variant="outline" onClick={onClose} />
                  </TooltipTrigger>
                  <TooltipContent>{t('common.utils.back')}</TooltipContent>
                </Tooltip>
              </div>
            )}
          </main>

          {/* 右侧边栏 */}
          {imagePreviewOperationBarStyle === 'normal' && (
            <RightSidebar
              onBack={onClose}
              hasPrev={hasPrev}
              hasNext={hasNext}
              onPrevImage={nonUrgentPrevImage}
              onNextImage={nonUrgentNextImage}
              onDeleteImage={handleDeleteImage}
            />
          )}
        </div>
      )}
    </>
  );
};
