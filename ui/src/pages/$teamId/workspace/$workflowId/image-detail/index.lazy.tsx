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
import { WorkbenchOperationBar } from '@/components/ui/vines-iframe/view/operation-bar';
import { VinesFlowProvider } from '@/components/ui/vines-iframe/view/vines-flow-provider';
import useUrlState from '@/hooks/use-url-state';
import { IVinesExecutionResultItem, VinesWorkflowExecution } from '@/package/vines-flow/core/typings.ts';
import { useExecutionImageResultStore, useHasNextImage, useHasPrevImage } from '@/store/useExecutionImageResultStore';
import { createFlowStore, FlowStoreProvider, useFlowStore } from '@/store/useFlowStore';
import {
  createOutputSelectionStore,
  OutputSelectionStoreProvider,
  useOutputSelectionStore,
} from '@/store/useOutputSelectionStore';
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
  const [processedInputs, setProcessedInputs] = useState<any[]>([]);
  const [showInputDiffBanner, setShowInputDiffBanner] = useState(false);
  const [originalInputValues, setOriginalInputValues] = useState<Record<string, any>>({});

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
      <FlowStoreProvider createStore={createFlowStore}>
        <OutputSelectionStoreProvider createStore={createOutputSelectionStore}>
          <ImageDetailInitializer workflowId={workflowId} currentImage={currentImage} />
          <div className={cn('flex h-full w-full gap-4 bg-neocard', isMiniFrame && 'justify-center')}>
            {/* 主内容区域 */}
            <main
              className={cn(
                'flex size-full flex-1 rounded-xl border border-input bg-slate-1 p-4 dark:bg-[#111113] md:flex-row',
                isMiniFrame && 'justify-center',
                !isMiniFrame && !showFormInImageDetail && 'justify-center',
              )}
            >
              {/* 左侧图片展示区 */}
              <div
                className={cn(
                  'flex h-full flex-col items-center justify-between overflow-auto pr-4 dark:bg-[#111113]',
                  isMiniFrame ? 'w-full' : !showFormInImageDetail ? 'w-full' : 'w-[450px] sm:w-full md:w-[70%]',
                )}
              >
                {imageUrl ? (
                  <>
                    <div className="flex w-full flex-1 items-center justify-center">
                      <div className="vines-center size-full overflow-auto">
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
                            transition: 'transform 0.3s ease',
                          }}
                          // preview={false}
                          // preview={false}
                        />
                      </div>
                    </div>
                    {/* 图片操作按钮 - 中间 */}
                    <div className="flex w-full flex-col gap-4 overflow-hidden">
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
                      <div
                        style={{
                          maxWidth: showFormInImageDetail ? '70vw' : '93vw',
                        }}
                      >
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
                <div className="relative flex h-full flex-1 flex-col gap-4 rounded-r-xl rounded-tr-xl border-l border-input pl-4 dark:bg-[#111113]">
                  <ScrollArea disabledOverflowMask className="flex-1 overflow-hidden">
                    <TabularRenderWrapper
                      execution={execution}
                      processedInputs={processedInputs}
                      showInputDiffBanner={showInputDiffBanner}
                      originalInputValues={originalInputValues}
                      onProcessedInputsChange={setProcessedInputs}
                      onShowInputDiffBannerChange={setShowInputDiffBanner}
                      onOriginalInputValuesChange={setOriginalInputValues}
                    />
                  </ScrollArea>
                  <div className="z-20 dark:bg-[#111113]">
                    <TabularFooterButtons processedInputs={processedInputs} />
                  </div>
                </div>
              )}
            </main>

            {/* 如果关联存在，则显示关联 */}
            <WorkbenchOperationBar />

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
        </OutputSelectionStoreProvider>
      </FlowStoreProvider>
    </VinesFlowProvider>
  );
};

// 创建一个新的组件来初始化 FlowStore
const ImageDetailInitializer: React.FC<{ workflowId: string; currentImage: IVinesExecutionResultItem }> = ({
  workflowId,
  currentImage,
}) => {
  const setWorkflowId = useFlowStore((s) => s.setWorkflowId);
  const { setOutputSelections } = useOutputSelectionStore();

  useEffect(() => {
    setWorkflowId(workflowId);
  }, [workflowId, setWorkflowId]);

  useEffect(() => {
    setOutputSelections([
      {
        outputId: currentImage.render?.key ?? currentImage.instanceId,
        item: currentImage,
      },
    ]);
  }, [currentImage, setOutputSelections]);

  return null;
};

export const Route = createLazyFileRoute('/$teamId/workspace/$workflowId/image-detail/')({
  component: ImageDetail,
});
