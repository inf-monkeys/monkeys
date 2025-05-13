import React, { useEffect, useState } from 'react';

import { createLazyFileRoute, useParams, useRouter } from '@tanstack/react-router';

import { useEventEmitter, useMemoizedFn } from 'ahooks';
import {
    ChevronDown,
    ChevronUp,
    Download,
    FlipHorizontal,
    FlipVertical,
    RotateCcw,
    RotateCw,
    Trash,
    X,
    ZoomIn,
    ZoomOut,
} from 'lucide-react';
import Image from 'rc-image';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { deleteWorkflowExecution } from '@/apis/workflow/execution';
import ImageDetailLayout from '@/components/layout/image-detail-layout';
import { TabularRender, TTabularEvent } from '@/components/layout/workspace/vines-view/form/tabular/render';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { VinesFlowProvider } from '@/components/ui/vines-iframe/view/vines-flow-provider';
import { useVinesFlow } from '@/package/vines-flow';

import 'rc-image/assets/index.css';

interface IImageDetailProps {}

interface TabularRenderWrapperProps {
  height?: number;
}

// TabularRender包装组件，用于获取工作流输入参数
const TabularRenderWrapper: React.FC<TabularRenderWrapperProps> = ({ height }) => {
  const { vines } = useVinesFlow();
  const tabular$ = useEventEmitter<TTabularEvent>();
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

  return (
    <TabularRender
      inputs={inputs}
      height={dynamicHeight}
      event$={tabular$}
      workflowId={workflowId}
      scrollAreaClassName=""
    />
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

  // 从路由搜索参数中获取图片信息
  const searchParams = new URLSearchParams(window.location.search);
  const imageUrl = searchParams.get('imageUrl') || '';
  const instanceId = searchParams.get('instanceId') || '';

  const { workflowId } = useParams({ from: '/$teamId/workspace/$workflowId/image-detail/' });

  // 上一张/下一张图片功能已禁用，不再需要获取图片列表

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
    // 如果有instanceId，则调用API删除
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
            <Button icon={<ChevronUp />} variant="outline" size="small" disabled={true} />
          </TooltipTrigger>
          <TooltipContent>{t('workspace.image-detail.prev-image', '上一张')}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button icon={<ChevronDown />} variant="outline" size="small" disabled={true} />
          </TooltipTrigger>
          <TooltipContent>{t('workspace.image-detail.next-image', '下一张')}</TooltipContent>
        </Tooltip>
      </div>

      <div className="mb-6">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              icon={<Trash />}
              variant="outline"
              size="small"
              onClick={handleDeleteImage}
            />
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
                <div className="flex w-full items-center justify-center gap-2 bg-background py-3 dark:bg-[#111113] sm:gap-1 md:gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        icon={<FlipVertical />}
                        variant="outline"
                        size="small"
                        onClick={() => {
                          // 直接应用垂直翻转效果
                          setImageFlipY((prev) => !prev);
                          toast.success(t('components.ui.image-preview.flipY-success', '已垂直翻转'));
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
                          toast.success(t('components.ui.image-preview.flipX-success', '已水平翻转'));
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
                          toast.success(t('components.ui.image-preview.rotateLeft-success', '已向左旋转'));
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
                          toast.success(t('components.ui.image-preview.rotateRight-success', '已向右旋转'));
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
                          toast.success(t('components.ui.image-preview.zoomIn-success', '已放大'));
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
                          toast.success(t('components.ui.image-preview.zoomOut-success', '已缩小'));
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
                            } catch (error) {
                              console.error('下载异常:', error);
                            }
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
          <div className="flex h-full flex-1 flex-col overflow-auto rounded-r-xl rounded-tr-xl bg-background px-6 pt-6 dark:bg-[#111113] md:border-l md:border-input">
            <div className="h-full flex-1">
              <TabularRenderWrapper height={window.innerHeight - 150} />
            </div>
          </div>
        </main>
      </ImageDetailLayout>
    </VinesFlowProvider>
  );
};

export const Route = createLazyFileRoute('/$teamId/workspace/$workflowId/image-detail/')({
  component: ImageDetail,
});
