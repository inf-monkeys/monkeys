import React, { startTransition, useCallback, useEffect, useState } from 'react';

import { createLazyFileRoute, useParams, useRouter } from '@tanstack/react-router';

import { useMemoizedFn } from 'ahooks';
import Image from 'rc-image';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useCustomConfigs } from '@/apis/authz/team/custom-configs';
import { deleteWorkflowExecution, getWorkflowExecution } from '@/apis/workflow/execution';
import { ImageOperations } from '@/components/layout/workbench/image-detail/image-operation';
import { RightSidebar } from '@/components/layout/workbench/image-detail/right-side-bar';
import { ImagesCarousel } from '@/components/layout/workbench/image-detail/swiper-carousel';
import { TabularFooterButtons } from '@/components/layout/workbench/image-detail/tabular-footer-buttons';
import { TabularRenderWrapper } from '@/components/layout/workbench/image-detail/tabular-wrapper';
import { ScrollArea } from '@/components/ui/scroll-area';
import { VinesFlowProvider } from '@/components/ui/vines-iframe/view/vines-flow-provider';
import useUrlState from '@/hooks/use-url-state';
import { VinesWorkflowExecution } from '@/package/vines-flow/core/typings.ts';
import { useExecutionImageResultStore, useHasNextImage, useHasPrevImage } from '@/store/useExecutionImageResultStore';
import { cn } from '@/utils';

// Import Swiper styles
import 'rc-image/assets/index.css';

interface IImageDetailProps {}

export const ImageDetail: React.FC<IImageDetailProps> = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { history } = router;
  const [imageRotation, setImageRotation] = useState(0);
  const [imageFlipX, setImageFlipX] = useState(false);
  const [imageFlipY, setImageFlipY] = useState(false);
  const [imageScale, setImageScale] = useState(1);
  const [{ mode }] = useUrlState<{ mode: 'normal' | 'fast' | 'mini' }>({ mode: 'mini' });
  const isMiniFrame = mode === 'mini';
  const { images, position, nextImage, prevImage, clearImages } = useExecutionImageResultStore();
  const { showFormInImageDetail } = useCustomConfigs();

  // 提升的状态管理
  const [processedInputs, setProcessedInputs] = React.useState<any[]>([]);
  const [showInputDiffBanner, setShowInputDiffBanner] = React.useState(false);
  const [originalInputValues, setOriginalInputValues] = React.useState<Record<string, any>>({});

  const currentImage = images[position];
  const imageUrl = currentImage?.render?.data as string;
  const instanceId = currentImage?.instanceId;
  const hasPrev = useHasPrevImage();
  const hasNext = useHasNextImage();

  const nonUrgentNextImage = useCallback(() => {
    startTransition(() => {
      nextImage();
    });
  }, [nextImage]);
  const nonUrgentPrevImage = useCallback(() => {
    startTransition(() => {
      prevImage();
    });
  }, [prevImage]);

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
          clearImages();
          history.back();
        }
      },
      {
        signal: controller.signal,
      },
    );
    return () => {
      controller.abort();
    };
  }, [nonUrgentPrevImage, nonUrgentNextImage, clearImages, history]);

  const [execution, setExecution] = useState<VinesWorkflowExecution | undefined>();

  const { workflowId } = useParams({ from: '/$teamId/workspace/$workflowId/image-detail/' });

  useEffect(() => {
    if (!instanceId) return;
    getWorkflowExecution(instanceId).then((executionResult) => {
      if (!executionResult) return;
      setExecution(executionResult);
    });
  }, [instanceId]);

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
  const handleDeleteImage = useMemoizedFn(() => {
    if (instanceId) {
      toast.promise(deleteWorkflowExecution(instanceId), {
        success: () => {
          // 删除成功后返回上一页
          history.back();
          return t('common.delete.success');
        },
        error: t('common.delete.error'),
        loading: t('common.delete.loading'),
      });
    } else {
      // 如果没有instanceId，直接返回上一页
      history.back();
      clearImages();
      toast.success(t('common.delete.success'));
    }
  });

  return (
    <VinesFlowProvider workflowId={workflowId}>
      <div className={cn('flex h-full w-full bg-neocard', isMiniFrame && 'justify-center')}>
        {/* 主内容区域 */}
        <main
          className={cn(
            'flex size-full flex-1 rounded-xl border border-input bg-background py-2 pb-6 shadow-sm dark:bg-[#111113] md:flex-row',
            isMiniFrame && 'justify-center',
            !isMiniFrame && !showFormInImageDetail && 'justify-center',
          )}
        >
          {/* 左侧图片展示区 */}
          <div
            className={cn(
              'flex h-full flex-col items-center overflow-auto bg-background dark:bg-[#111113]',
              isMiniFrame ? 'w-full' : !showFormInImageDetail ? 'w-full' : 'w-[450px] sm:w-full md:w-[70%]',
            )}
          >
            {imageUrl ? (
              <>
                <div className="flex w-full basis-4/5 items-center justify-center p-4">
                  {/* <Image
                    src={imageUrl}
                    alt="详情图片"
                    className="rounded-lg"
                    style={{
                      display: 'block',
                      margin: 'auto',
                      maxWidth: '100%',
                      maxHeight: 'calc(100vh - 300px)',
                      width: 'auto',
                      height: 'auto',
                      objectFit: 'contain',
                      transform: `
                        rotate(${imageRotation}deg)
                        scaleX(${imageFlipX ? -1 : 1})
                        scaleY(${imageFlipY ? -1 : 1})
                        scale(${imageScale})
                      `,
                      transition: 'transform 0.3s ease',
                    }}
                    preview={false}
                  /> */}
                  <div
                    // style={{
                    //   display: 'block',
                    //   margin: 'auto',
                    //   maxWidth: '100%',
                    //   maxHeight: 'calc(100vh - 300px)',
                    //   width: 'auto',
                    //   height: 'auto',
                    //   objectFit: 'contain',
                    //   //   transform: `
                    //   //   rotate(${imageRotation}deg)
                    //   //   scaleX(${imageFlipX ? -1 : 1})
                    //   //   scaleY(${imageFlipY ? -1 : 1})
                    //   //   scale(${imageScale})
                    //   // `,
                    //   //   transition: 'transform 0.3s ease',
                    // }}
                    className="vines-center size-full overflow-auto"
                  >
                    <Image
                      src={imageUrl}
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
                        //   transform: `
                        //   rotate(${imageRotation}deg)
                        //   scaleX(${imageFlipX ? -1 : 1})
                        //   scaleY(${imageFlipY ? -1 : 1})
                        //   scale(${imageScale})
                        // `,
                        transition: 'transform 0.3s ease',
                      }}
                      // preview={false}
                    />
                  </div>
                </div>
                {/* 图片操作按钮 - 中间 */}
                <div className="basis:1/5 w-full overflow-hidden px-4">
                  <ImageOperations
                    // imageUrl={imageUrl}
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
                  <div className="">
                    <ImagesCarousel />
                  </div>
                </div>
              </>
            ) : (
              <div className="vines-center size-full text-center text-3xl text-muted-foreground">
                {t('workspace.image-detail.no-image', '无图片数据')}
              </div>
            )}
          </div>

          {/* 右侧表单区域 */}
          {!isMiniFrame && showFormInImageDetail && (
            <div className="relative flex h-full flex-1 flex-col rounded-r-xl rounded-tr-xl bg-background px-6 pt-6 dark:bg-[#111113] md:border-l md:border-input">
              <ScrollArea disabledOverflowMask className="flex-1 overflow-hidden">
                <TabularRenderWrapper
                  height={window.innerHeight - 120}
                  execution={execution}
                  processedInputs={processedInputs}
                  showInputDiffBanner={showInputDiffBanner}
                  originalInputValues={originalInputValues}
                  onProcessedInputsChange={setProcessedInputs}
                  onShowInputDiffBannerChange={setShowInputDiffBanner}
                  onOriginalInputValuesChange={setOriginalInputValues}
                />
              </ScrollArea>
              <div>
                <div className="z-20 bg-background py-2 dark:bg-[#111113]">
                  <TabularFooterButtons processedInputs={processedInputs} />
                </div>
              </div>
            </div>
          )}
        </main>

        {/* 右侧边栏 */}
        <RightSidebar
          onBack={() => history.back()}
          hasPrev={!!hasPrev}
          hasNext={!!hasNext}
          onPrevImage={nonUrgentPrevImage}
          onNextImage={nonUrgentNextImage}
          onDeleteImage={handleDeleteImage}
        />
      </div>
    </VinesFlowProvider>
  );
};

export const Route = createLazyFileRoute('/$teamId/workspace/$workflowId/image-detail/')({
  component: ImageDetail,
});
