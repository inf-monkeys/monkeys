import React, { startTransition, useCallback, useEffect, useState } from 'react';

import { createLazyFileRoute, useParams, useRouter } from '@tanstack/react-router';

import { useAsyncEffect, useEventEmitter, useMemoizedFn } from 'ahooks';
import { isBoolean } from 'lodash';
import {
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  FlipHorizontal,
  FlipVertical,
  RotateCcw,
  RotateCw,
  Sparkles,
  Trash,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import Image from 'rc-image';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useCustomConfigs } from '@/apis/authz/team/custom-configs';
import { useSystemConfig } from '@/apis/common';
import { deleteWorkflowExecution, getWorkflowExecution } from '@/apis/workflow/execution';
import { TabularRender, TTabularEvent } from '@/components/layout/workspace/vines-view/form/tabular/render';
import { Button } from '@/components/ui/button';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { VinesFlowProvider } from '@/components/ui/vines-iframe/view/vines-flow-provider';
import { checkImageUrlAvailable } from '@/components/ui/vines-image/utils';
import { useCopy } from '@/hooks/use-copy';
import useUrlState from '@/hooks/use-url-state';
import { useVinesFlow } from '@/package/vines-flow';
import { VinesWorkflowExecution } from '@/package/vines-flow/core/typings.ts';
import {
  ImagesResult,
  useExecutionImageResultStore,
  useExecutionImages,
  useExecutionPosition,
  useHasNextImage,
  useHasPrevImage,
  useSetExecutionPosition,
} from '@/store/useExecutionImageResultStore';
import { useThumbImages } from '@/store/useExecutionImageTumbStore';
import { cn } from '@/utils';

import 'rc-image/assets/index.css';

interface IImageDetailProps {}

interface TabularRenderWrapperProps {
  height?: number;
  execution?: VinesWorkflowExecution;
  processedInputs: any[];
  showInputDiffBanner: boolean;
  originalInputValues: Record<string, any>;
  onProcessedInputsChange: (inputs: any[]) => void;
  onShowInputDiffBannerChange: (show: boolean) => void;
  onOriginalInputValuesChange: (values: Record<string, any>) => void;
}

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

const ImageOperations: React.FC<ImageOperationsProps> = ({
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
    <div className="flex w-full basis-1/5 items-center justify-center gap-2 bg-background py-5 dark:bg-[#111113] sm:gap-1 md:gap-2">
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

// TabularRender包装组件，用于获取工作流输入参数
const TabularRenderWrapper: React.FC<TabularRenderWrapperProps> = ({
  height,
  execution,
  processedInputs,
  showInputDiffBanner,
  originalInputValues,
  onProcessedInputsChange,
  onShowInputDiffBannerChange,
  onOriginalInputValuesChange,
}) => {
  const { vines } = useVinesFlow();
  const tabular$ = useEventEmitter<TTabularEvent>();
  const { t } = useTranslation();
  const [windowHeight, setWindowHeight] = React.useState(window.innerHeight);

  // 监听窗口大小变化
  React.useEffect(() => {
    const handleResize = () => {
      setWindowHeight(window.innerHeight);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // 从vines中获取工作流输入参数
  const inputs = vines.workflowInput;
  const workflowId = vines.workflowId;

  // 计算动态高度，确保表单能够适应窗口高度
  const dynamicHeight = height || Math.max(1000, windowHeight - 150);

  // 处理输入字段和原始图片
  React.useEffect(() => {
    if (!inputs || inputs.length === 0) {
      // console.log('TabularRenderWrapper: 没有输入字段可用');
      onProcessedInputsChange([]);
      return;
    }

    const newInputs = execution
      ? inputs.map((input) => {
          return {
            ...input,
            default: execution.input?.[input.name] ?? input.default,
          };
        })
      : [];
    // console.log('TabularRenderWrapper: 表单输入字段:', newInputs);
    onProcessedInputsChange(newInputs);

    // 保存原始输入值
    if (execution?.input) {
      onOriginalInputValuesChange(execution.input);
    }
  }, [inputs, execution, onProcessedInputsChange, onOriginalInputValuesChange]);

  // 监听表单值变化
  useEffect(() => {
    if (!execution?.input || !processedInputs.length) return;

    const currentValues = processedInputs.reduce(
      (acc, input) => {
        acc[input.name] = input.default;
        return acc;
      },
      {} as Record<string, any>,
    );

    // 比较当前值与原始值
    const hasChanged = Object.keys(originalInputValues).some((key) => originalInputValues[key] !== currentValues[key]);

    onShowInputDiffBannerChange(hasChanged);
  }, [processedInputs, originalInputValues, execution, onShowInputDiffBannerChange]);

  if (!processedInputs.length) {
    return (
      <div className="vines-center size-full text-center text-xl text-muted-foreground">
        {t('workspace.image-detail.no-inputs', '无输入参数')}
      </div>
    );
  }

  return (
    <div className="relative size-full">
      {false && (
        <div className="left-0 right-0 top-0 z-10 mb-4 rounded bg-yellow-100 px-4 py-2 text-center text-sm text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
          {t('workspace.image-detail.input-diff-banner')}
        </div>
      )}
      <TabularRender
        inputs={processedInputs}
        height={dynamicHeight}
        event$={tabular$}
        workflowId={workflowId}
        scrollAreaClassName=""
      ></TabularRender>
    </div>
  );
};

interface TabularFooterButtonsProps {
  processedInputs: any[];
}

const TabularFooterButtons: React.FC<TabularFooterButtonsProps> = ({ processedInputs }) => {
  const { t } = useTranslation();
  const { copy } = useCopy();
  const { vines } = useVinesFlow();
  const { data: oem } = useSystemConfig();
  const [loading, setLoading] = useState(false);
  const form = useFormContext();

  // 生成按钮通过事件触发提交
  const handleGenerate = () => {
    form.handleSubmit(async (values) => {
      setLoading(true);
      try {
        await vines.start({ inputData: values, onlyStart: true });
        if (
          !isBoolean(oem?.theme?.views?.form?.toast?.afterCreate) ||
          oem?.theme?.views?.form?.toast?.afterCreate != false
        )
          toast.success(t('workspace.pre-view.actuator.execution.workflow-execution-created'));
      } catch (error) {
        // console.error('生成失败:', error);
        toast.error(t('workspace.pre-view.actuator.execution.error'));
      } finally {
        setLoading(false);
      }
    })();
  };

  // 复制当前表单参数
  const handleCopy = () => {
    const values = form.getValues();
    const data = processedInputs.map((input) => ({
      id: input.name,
      displayName: input.displayName,
      description: input.description,
      data: values[input.name],
      type: input.type,
    }));
    copy(JSON.stringify({ type: 'input-parameters', data }));
    toast.success(t('workspace.pre-view.actuator.detail.form-render.actions.copy-input-success'));
  };

  return (
    <div className="z-10 flex h-9 items-center justify-center gap-2">
      <Button icon={<Copy />} variant="outline" size="small" onClick={handleCopy} className="h-full text-base">
        {t('workspace.pre-view.actuator.detail.form-render.actions.copy-input')}
      </Button>
      <Button
        icon={<Sparkles className="fill-white" />}
        variant="solid"
        size="small"
        className="size-full text-base"
        onClick={handleGenerate}
        loading={loading}
      >
        {t('workspace.pre-view.actuator.execution.label')}
      </Button>
    </div>
  );
};

interface RightSidebarProps {
  onBack: () => void;
  hasPrev: boolean;
  hasNext: boolean;
  onPrevImage: () => void;
  onNextImage: () => void;
  onDeleteImage: () => void;
}

const RightSidebar: React.FC<RightSidebarProps> = ({
  onBack,
  hasPrev,
  hasNext,
  onPrevImage,
  onNextImage,
  onDeleteImage,
}) => {
  const { t } = useTranslation();

  return (
    // <div className="ml-4 flex h-full w-14 flex-col items-center justify-between gap-4 rounded-bl-xl rounded-br-xl rounded-tl-xl rounded-tr-xl border border-input bg-background px-2 pb-6 pt-8 shadow-sm dark:bg-[#111113]">
    <div className="h-full rounded-xl border border-input bg-slate-1">
      <div className="flex h-full w-[4.8rem] flex-col items-center justify-between p-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button icon={<X />} variant="outline" onClick={onBack} />
          </TooltipTrigger>
          <TooltipContent>{t('common.utils.back')}</TooltipContent>
        </Tooltip>

        <div className="flex flex-col items-center gap-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button icon={<ChevronUp />} variant="outline" disabled={!hasPrev} onClick={onPrevImage} />
            </TooltipTrigger>
            <TooltipContent>{t('workspace.image-detail.prev-image')}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button icon={<ChevronDown />} variant="outline" disabled={!hasNext} onClick={onNextImage} />
            </TooltipTrigger>
            <TooltipContent>{t('workspace.image-detail.next-image')}</TooltipContent>
          </Tooltip>
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button icon={<Trash />} variant="outline" onClick={onDeleteImage} />
          </TooltipTrigger>
          <TooltipContent>{t('workspace.image-detail.delete')}</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
};

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
      <div className={cn('flex h-full w-full gap-4 bg-neocard', isMiniFrame && 'justify-center')}>
        {/* 主内容区域 */}
        <main
          className={cn(
            'flex size-full flex-1 rounded-xl border border-input bg-background dark:bg-[#111113] md:flex-row',
            isMiniFrame && 'justify-center',
            !isMiniFrame && !showFormInImageDetail && 'justify-center',
          )}
        >
          {/* 左侧图片展示区 */}
          <div
            className={cn(
              'flex h-full flex-col items-center justify-between overflow-auto bg-background dark:bg-[#111113]',
              isMiniFrame ? 'w-full' : !showFormInImageDetail ? 'w-full' : 'w-[450px] sm:w-full md:w-[70%]',
            )}
          >
            {imageUrl ? (
              <>
                <div className="flex w-full items-center justify-center p-4">
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
                    />
                  </div>
                </div>
                {/* 图片操作按钮 - 中间 */}
                <div className="w-full overflow-hidden p-4">
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
                  <ImagesCarousel className="w-full" />
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
            <div className="relative flex h-full flex-1 flex-col gap-4 rounded-r-xl rounded-tr-xl bg-background p-4 dark:bg-[#111113] md:border-l md:border-input">
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
              <div className="z-20 bg-background dark:bg-[#111113]">
                <TabularFooterButtons processedInputs={processedInputs} />
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

// 完善 ImagesCarousel 组件并移动到文件中合适位置
interface ImagesCarouselProps {
  className?: string;
}

const ImagesCarousel: React.FC<ImagesCarouselProps> = ({ className }) => {
  const [carouselApi, setCarouselApi] = React.useState<any>();

  return (
    <Carousel
      setApi={setCarouselApi}
      opts={{
        align: 'start',
        containScroll: 'trimSnaps',
        slidesToScroll: 1,
      }}
      orientation="horizontal"
      className={cn(className, 'overflow-hidden')}
    >
      <CarouselContent className="flex justify-center">
        <CarouselItemList carouselApi={carouselApi} />
      </CarouselContent>
    </Carousel>
  );
};

function CarouselItemList({ carouselApi }: { carouselApi: any }) {
  const position = useExecutionPosition();
  const setPosition = useSetExecutionPosition();
  const thumbImages = useThumbImages();

  React.useEffect(() => {
    if (carouselApi && position !== undefined) {
      carouselApi.scrollTo(position);
    }
  }, [carouselApi, position]);

  // 如果只有一张图片或没有图片，不显示 carousel
  if (!thumbImages || thumbImages.length <= 1) {
    return null;
  }

  // 处理点击缩略图
  const handleThumbnailClick = (index: number) => {
    if (index === position) return;
    setPosition(index);
  };

  return thumbImages.map((image, index) => {
    return (
      <CarouselItem
        key={image.render.key || index}
        className="-mr-2 basis-auto hover:cursor-pointer"
        onClick={() => handleThumbnailClick(index)}
      >
        <CarouselItemImage image={image} index={index} />
      </CarouselItem>
    );
  });
}

function CarouselItemImage({ image, index }: { image: ImagesResult; index: number }) {
  const [shouldUseThumbnail, setShouldUseThumbnail] = useState(true);
  const images = useExecutionImages();
  useAsyncEffect(async () => {
    const res = await checkImageUrlAvailable(image.render.data as string);
    setShouldUseThumbnail(res);
  }, [image]);

  return (
    <img
      src={shouldUseThumbnail ? (image.render.data as string) : (images[index].render.data as string)}
      alt={`Thumbnail`}
      className="size-16 rounded-md border border-border object-cover"
      loading="lazy"
    />
  );
}
