import React, { useEffect, useState } from 'react';

import { createLazyFileRoute, useParams, useRouter } from '@tanstack/react-router';

import { useEventEmitter } from 'ahooks';
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

import ImageDetailLayout from '@/components/layout/image-detail-layout';
import { TabularRender, TTabularEvent } from '@/components/layout/workspace/vines-view/form/tabular/render';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);
  const [imageList, setImageList] = useState<string[]>([]);
  const [imageRotation, setImageRotation] = useState(0);
  const [imageFlipX, setImageFlipX] = useState(false);
  const [imageFlipY, setImageFlipY] = useState(false);
  const [imageScale, setImageScale] = useState(1);

  // 从路由搜索参数中获取图片信息
  const searchParams = new URLSearchParams(window.location.search);
  const imageUrl = searchParams.get('imageUrl') || '';

  const { workflowId } = useParams({ from: '/$teamId/workspace/$workflowId/image-detail/' });

  // 获取当前工作流的所有图片
  useEffect(() => {
    if (imageUrl) {
      // 这里应该是从API获取图片列表的逻辑
      // 为了演示，我们模拟一个图片列表
      setImageList([imageUrl, '/fallback_image.webp', '/fallback_image_dark.webp']);

      // 找到当前图片在列表中的索引
      const index = imageList.findIndex((url) => url === imageUrl);
      if (index !== -1) {
        setImageIndex(index);
      }
    }
  }, [imageUrl]);

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

  // 处理上一张/下一张图片
  const handlePrevImage = () => {
    if (imageList.length > 1 && imageIndex > 0) {
      const newIndex = imageIndex - 1;
      setImageIndex(newIndex);
      // 更新URL参数，保持状态同步
      const newSearchParams = new URLSearchParams(window.location.search);
      newSearchParams.set('imageUrl', imageList[newIndex]);
      router.navigate({
        search: newSearchParams.toString(),
      });
      toast.success(t('workspace.image-detail.prev-image-success', '已切换到上一张图片'));
    } else {
      toast.info(t('workspace.image-detail.no-prev-image', '已经是第一张图片'));
    }
  };

  const handleNextImage = () => {
    if (imageList.length > 1 && imageIndex < imageList.length - 1) {
      const newIndex = imageIndex + 1;
      setImageIndex(newIndex);
      // 更新URL参数，保持状态同步
      const newSearchParams = new URLSearchParams(window.location.search);
      newSearchParams.set('imageUrl', imageList[newIndex]);
      router.navigate({
        search: newSearchParams.toString(),
      });
      toast.success(t('workspace.image-detail.next-image-success', '已切换到下一张图片'));
    } else {
      toast.info(t('workspace.image-detail.no-next-image', '已经是最后一张图片'));
    }
  };

  // 处理删除图片
  const handleDeleteImage = () => {
    // 这里应该是删除图片的API调用
    // 为了演示，我只是从列表中移除
    if (imageList.length > 0) {
      const newImageList = [...imageList];
      newImageList.splice(imageIndex, 1);
      setImageList(newImageList);

      if (newImageList.length > 0) {
        // 如果还有图片，显示下一张或上一张
        const newIndex = imageIndex >= newImageList.length ? newImageList.length - 1 : imageIndex;
        setImageIndex(newIndex);
        // 更新URL参数
        const newSearchParams = new URLSearchParams(window.location.search);
        newSearchParams.set('imageUrl', newImageList[newIndex]);
        router.navigate({
          search: newSearchParams.toString(),
        });
      } else {
        // 如果没有图片了，返回上一页
        history.back();
      }
      toast.success(t('workspace.image-detail.delete-success', '图片已删除'));
    }
    setShowDeleteDialog(false);
  };

  // 右侧边栏组件
  const RightSidebar = (
    <div className="ml-4 flex h-[calc(100vh-5.75rem-1rem)] w-14 flex-col items-center justify-between gap-4 rounded-bl-xl rounded-br-xl rounded-tl-xl rounded-tr-xl border border-input bg-background px-2 py-6 shadow-sm dark:bg-[#111113]">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button icon={<X />} variant="outline" size="small" onClick={() => history.back()} />
        </TooltipTrigger>
        <TooltipContent>{t('common.utils.back', '返回')}</TooltipContent>
      </Tooltip>

      <div className="flex flex-col items-center gap-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              icon={<ChevronUp />}
              variant="outline"
              size="small"
              onClick={handlePrevImage}
              disabled={imageList.length <= 1 || imageIndex <= 0}
            />
          </TooltipTrigger>
          <TooltipContent>{t('workspace.image-detail.prev-image', '上一张')}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              icon={<ChevronDown />}
              variant="outline"
              size="small"
              onClick={handleNextImage}
              disabled={imageList.length <= 1 || imageIndex >= imageList.length - 1}
            />
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
              disabled={!imageUrl}
              onClick={() => setShowDeleteDialog(true)}
            />
          </TooltipTrigger>
          <TooltipContent>{t('workspace.image-detail.delete', '删除')}</TooltipContent>
        </Tooltip>

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('workspace.image-detail.delete-confirm-title', '确认删除')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('workspace.image-detail.delete-confirm-desc', '确定要删除这张图片吗？此操作无法撤销。')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common.utils.cancel', '取消')}</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteImage}>{t('common.utils.confirm', '确认')}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );

  return (
    <VinesFlowProvider workflowId={workflowId}>
      <ImageDetailLayout rightSidebar={RightSidebar}>
        {/* 主内容区域 */}
        <main className="flex size-full flex-1 flex-col overflow-hidden rounded-xl border border-input bg-background shadow-sm dark:bg-[#111113] md:flex-row">
          {/* 左侧图片展示区 */}
          <div className="flex w-full flex-col items-center justify-start overflow-hidden rounded-bl-xl rounded-br-xl rounded-tl-xl bg-background px-6 dark:bg-[#111113] sm:w-full md:w-[70%]">
            {imageUrl ? (
              <>
                <div
                  className="flex w-full items-center justify-center"
                  style={{ maxHeight: '80vh', width: '100%', marginTop: '20px', overflow: 'auto' }}
                >
                  <Image
                    src={imageUrl}
                    alt="详情图片"
                    className="rounded-lg"
                    style={{
                      display: 'block',
                      margin: 'auto',
                      maxWidth: '100%',
                      maxHeight: '80vh',
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
                {/* 图片操作按钮 */}
                <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-1 md:gap-2">
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
