import React, { useEffect, useState } from 'react';

import { createLazyFileRoute, useParams, useRouter } from '@tanstack/react-router';

import { useEventEmitter, useMemoizedFn } from 'ahooks';
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

import { deleteWorkflowExecution, getWorkflowExecution } from '@/apis/workflow/execution';
import ImageDetailLayout from '@/components/layout/image-detail-layout';
import {
  useExecutionImageResultStore,
  useHasNextImage,
  useHasPrevImage,
} from '@/components/layout/workspace/vines-view/form/execution-result/grid';
import { TabularRender, TTabularEvent } from '@/components/layout/workspace/vines-view/form/tabular/render';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { VinesFlowProvider } from '@/components/ui/vines-iframe/view/vines-flow-provider';
import { useCopy } from '@/hooks/use-copy';
import { useVinesFlow } from '@/package/vines-flow';
import { VinesWorkflowExecution } from '@/package/vines-flow/core/typings.ts';

import 'rc-image/assets/index.css';

interface IImageDetailProps { }

interface TabularRenderWrapperProps {
  height?: number;
  execution?: VinesWorkflowExecution;
}

// 扩展 TTabularEvent 类型
type ExtendedTabularEvent = TTabularEvent | { type: 'form-change'; data: any };

// TabularRender包装组件，用于获取工作流输入参数
const TabularRenderWrapper: React.FC<TabularRenderWrapperProps> = ({ height, execution }) => {
  const { vines } = useVinesFlow();
  const tabular$ = useEventEmitter<TTabularEvent>();
  const [windowHeight, setWindowHeight] = React.useState(window.innerHeight);
  const [processedInputs, setProcessedInputs] = React.useState<any[]>([]);
  const [showInputDiffBanner, setShowInputDiffBanner] = React.useState(false);
  const [originalInputValues, setOriginalInputValues] = React.useState<Record<string, any>>({});

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
      console.log('TabularRenderWrapper: 没有输入字段可用');
      setProcessedInputs([]);
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
    console.log('TabularRenderWrapper: 表单输入字段:', newInputs);
    setProcessedInputs(newInputs);

    // 保存原始输入值
    if (execution?.input) {
      setOriginalInputValues(execution.input);
    }
  }, [inputs, execution]);

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
    const hasDiff = Object.keys(currentValues).some((key) => {
      const originalValue = originalInputValues[key];
      const currentValue = currentValues[key];
      return JSON.stringify(originalValue) !== JSON.stringify(currentValue);
    });

    setShowInputDiffBanner(hasDiff);
  }, [processedInputs, originalInputValues]);

  // 如果没有处理好的输入字段，显示加载状态
  if (processedInputs.length === 0 && inputs && inputs.length > 0) {
    return <div className="flex h-full w-full items-center justify-center">处理表单数据中...</div>;
  }

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      {showInputDiffBanner && (
        <div className="absolute left-0 right-0 top-0 z-10 border-b border-yellow-200 bg-yellow-100 p-3 dark:border-yellow-800 dark:bg-yellow-900/30">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            新的输入与原有输入不一致，可能会导致结果相差较大
          </p>
        </div>
      )}
      <TabularRender
        inputs={processedInputs}
        height={dynamicHeight}
        event$={tabular$}
        workflowId={workflowId}
        scrollAreaClassName=""
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 20,
            background: 'var(--background)',
            padding: '10px 0',
          }}
        >
          <TabularFooterButtons processedInputs={processedInputs} />
        </div>
      </TabularRender>
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
  const [loading, setLoading] = useState(false);
  const form = useFormContext();

  // 生成按钮通过事件触发提交
  const handleGenerate = () => {
    form.handleSubmit(async (values) => {
      setLoading(true);
      try {
        await vines.start({ inputData: values, onlyStart: true });
        toast.success(t('workspace.pre-view.actuator.execution.workflow-execution-created'));
      } catch (error) {
        console.error('生成失败:', error);
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
    <div className="z-10 flex w-full items-center justify-center gap-2 bg-background py-3 dark:bg-[#111113] sm:gap-1 md:gap-2">
      <Button icon={<Copy />} variant="outline" size="small" onClick={handleCopy}>
        {t('workspace.pre-view.actuator.detail.form-render.actions.copy-input', '复制输入')}
      </Button>
      <Button
        icon={<Sparkles className="fill-white" />}
        variant="solid"
        size="small"
        className="text-base"
        onClick={handleGenerate}
        loading={loading}
      >
        {t('workspace.pre-view.actuator.execution.label', '生成')}
      </Button>
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

  // const [urlState] = useUrlState({
  //   imageUrl: '',
  //   instanceId: '',
  // });
  const { images, position, nextImage, prevImage, clearImages } = useExecutionImageResultStore();
  const currentImage = images[position];
  const imageUrl = currentImage?.render?.data as string;
  const instanceId = currentImage?.instanceId;
  const hasPrev = useHasPrevImage();
  const hasNext = useHasNextImage();

  // const { imageUrl, instanceId } = urlState;

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

  // 上一张/下一张图片功能已禁用

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

  // 右侧边栏组件
  const RightSidebar = (
    <div className="ml-4 flex h-full w-14 flex-col items-center justify-between gap-4 rounded-bl-xl rounded-br-xl rounded-tl-xl rounded-tr-xl border border-input bg-background px-2 py-6 shadow-sm dark:bg-[#111113]">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button icon={<X />} variant="outline" size="small" onClick={() => history.back()} />
        </TooltipTrigger>
        <TooltipContent>{t('common.utils.back', '返回')}</TooltipContent>
      </Tooltip>

      <div className="flex flex-col items-center gap-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button icon={<ChevronUp />} variant="outline" size="small" disabled={!hasPrev} onClick={prevImage} />
          </TooltipTrigger>
          <TooltipContent>{t('workspace.image-detail.prev-image', '上一张')}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button icon={<ChevronDown />} variant="outline" size="small" disabled={!hasNext} onClick={nextImage} />
          </TooltipTrigger>
          <TooltipContent>{t('workspace.image-detail.next-image', '下一张')}</TooltipContent>
        </Tooltip>
      </div>

      <div className="mb-6">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button icon={<Trash />} variant="outline" size="small" onClick={handleDeleteImage} />
          </TooltipTrigger>
          <TooltipContent>{t('workspace.image-detail.delete', '删除')}</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );

  return (
    <VinesFlowProvider workflowId={workflowId}>
      <ImageDetailLayout rightSidebar={RightSidebar}>
        {/* 主内容区域 */}
        <main className="flex size-full flex-1 flex-col overflow-hidden rounded-xl border border-input bg-background pb-6 shadow-sm dark:bg-[#111113] md:flex-row">
          {/* 左侧图片展示区 */}
          <div className="flex h-full w-full flex-col items-center overflow-hidden rounded-bl-xl rounded-br-xl rounded-tl-xl bg-background dark:bg-[#111113] sm:w-full md:w-[70%]">
            {imageUrl ? (
              <>
                <div className="flex w-full flex-1 items-center justify-center overflow-auto p-4">
                  <Image
                    src={imageUrl}
                    alt="详情图片"
                    className="rounded-lg"
                    style={{
                      display: 'block',
                      margin: 'auto',
                      maxWidth: '100%',
                      maxHeight: 'calc(100vh - 200px)',
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
                  />
                </div>
                {/* 图片操作按钮 - 底部 */}
                <div className="flex w-full items-center justify-center gap-2 bg-background py-5 dark:bg-[#111113] sm:gap-1 md:gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        icon={<FlipVertical />}
                        variant="outline"
                        size="small"
                        onClick={() => {
                          // 直接应用垂直翻转效果
                          setImageFlipY((prev) => !prev);
                        }}
                      />
                    </TooltipTrigger>
                    <TooltipContent>{t('components.ui.image-preview.flipY', '垂直翻转')}</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        icon={<FlipHorizontal />}
                        variant="outline"
                        size="small"
                        onClick={() => {
                          // 直接应用水平翻转效果
                          setImageFlipX((prev) => !prev);
                        }}
                      />
                    </TooltipTrigger>
                    <TooltipContent>{t('components.ui.image-preview.flipX', '水平翻转')}</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        icon={<RotateCcw />}
                        variant="outline"
                        size="small"
                        onClick={() => {
                          // 直接应用左旋转效果
                          setImageRotation((prev) => prev - 90);
                        }}
                      />
                    </TooltipTrigger>
                    <TooltipContent>{t('components.ui.image-preview.rotateLeft', '向左旋转')}</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        icon={<RotateCw />}
                        variant="outline"
                        size="small"
                        onClick={() => {
                          // 直接应用右旋转效果
                          setImageRotation((prev) => prev + 90);
                        }}
                      />
                    </TooltipTrigger>
                    <TooltipContent>{t('components.ui.image-preview.rotateRight', '向右旋转')}</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        icon={<ZoomIn />}
                        variant="outline"
                        size="small"
                        onClick={() => {
                          // 直接应用放大效果
                          setImageScale((prev) => prev + 0.1);
                        }}
                      />
                    </TooltipTrigger>
                    <TooltipContent>{t('components.ui.image-preview.zoomIn', '放大')}</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        icon={<ZoomOut />}
                        variant="outline"
                        size="small"
                        onClick={() => {
                          // 直接应用缩小效果
                          setImageScale((prev) => Math.max(0.1, prev - 0.1));
                        }}
                      />
                    </TooltipTrigger>
                    <TooltipContent>{t('components.ui.image-preview.zoomOut', '缩小')}</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        icon={<Download />}
                        variant="outline"
                        size="small"
                        onClick={() => {
                          if (imageUrl) {
                            try {
                              const link = document.createElement('a');
                              link.href = imageUrl;
                              link.setAttribute('download', '');
                              link.setAttribute('target', '_self');
                              link.click();
                            } catch (error) { }
                          }
                        }}
                      />
                    </TooltipTrigger>
                    <TooltipContent>{t('common.utils.download.label', '下载')}</TooltipContent>
                  </Tooltip>
                </div>
              </>
            ) : (
              <div className="text-center text-muted-foreground">
                {t('workspace.image-detail.no-image', '无图片数据')}
              </div>
            )}
          </div>

          {/* 中间区域，渲染表单 */}
          <div className="relative flex h-full flex-1 flex-col rounded-r-xl rounded-tr-xl bg-background px-6 pt-6 dark:bg-[#111113] md:border-l md:border-input">
            {/* 内容区，底部预留按钮高度 */}
            <div className="flex-1 overflow-auto">
              <TabularRenderWrapper height={window.innerHeight - 120} execution={execution} />
            </div>
            {/* 按钮条 */}
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 20,
                background: 'var(--background)',
              }}
              className="dark:bg-[#111113]"
            ></div>
          </div>
        </main>
      </ImageDetailLayout>
    </VinesFlowProvider>
  );
};

export const Route = createLazyFileRoute('/$teamId/workspace/$workflowId/image-detail/')({
  component: ImageDetail,
});
