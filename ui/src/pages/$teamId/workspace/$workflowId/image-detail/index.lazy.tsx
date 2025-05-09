import React from 'react';

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
      scrollAreaClassName="pr-4"
    />
  );
};

export const ImageDetail: React.FC<IImageDetailProps> = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { history } = router;

  // 从路由搜索参数中获取图片信息
  const searchParams = new URLSearchParams(window.location.search);
  const imageUrl = searchParams.get('imageUrl') || '';

  const { workflowId } = useParams({ from: '/$teamId/workspace/$workflowId/image-detail/' });

  // 右侧边栏组件
  const RightSidebar = (
    <div className="ml-4 mt-4 flex h-[calc(100vh-5.75rem-1rem)] w-28 flex-col items-center justify-between gap-4 rounded-bl-xl rounded-br-xl rounded-tl-xl rounded-tr-xl border border-input bg-background px-2 py-6 shadow-sm">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button icon={<X />} variant="outline" size="small" onClick={() => history.back()} />
        </TooltipTrigger>
        <TooltipContent>{t('common.utils.back', '返回')}</TooltipContent>
      </Tooltip>

      <div className="flex flex-col items-center gap-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button icon={<ChevronUp />} variant="outline" size="small" />
          </TooltipTrigger>
          <TooltipContent>{t('workspace.image-detail.prev-image', '上一张')}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button icon={<ChevronDown />} variant="outline" size="small" />
          </TooltipTrigger>
          <TooltipContent>{t('workspace.image-detail.next-image', '下一张')}</TooltipContent>
        </Tooltip>
      </div>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button icon={<Trash />} variant="outline" size="small" />
        </TooltipTrigger>
        <TooltipContent>{t('workspace.image-detail.delete', '删除')}</TooltipContent>
      </Tooltip>
    </div>
  );

  return (
    <VinesFlowProvider workflowId={workflowId}>
      <ImageDetailLayout rightSidebar={RightSidebar}>
        {/* 主内容区域 */}
        <main className="mt-4 flex size-full flex-1 overflow-hidden rounded-xl border border-input bg-background shadow-sm">
          {/* 左侧图片展示区，添加rounded-l-xl和rounded-br-xl类 */}
          <div className="flex w-[70%] flex-col items-center justify-start overflow-hidden rounded-bl-xl rounded-br-xl rounded-tl-xl p-6">
            {imageUrl ? (
              <>
                <div
                  className="flex items-center justify-center overflow-hidden"
                  style={{ height: '80%', width: '100%', marginTop: '20px' }}
                >
                  <Image
                    src={imageUrl}
                    alt="详情图片"
                    className="rounded-lg object-contain"
                    style={{
                      maxWidth: '450px',
                      maxHeight: '400px',
                      width: 'auto',
                      height: 'auto',
                    }}
                    preview={{
                      icons: {
                        rotateLeft: (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button icon={<RotateCcw />} variant="outline" size="small" />
                            </TooltipTrigger>
                            <TooltipContent>{t('components.ui.image-preview.rotateLeft', '向左旋转')}</TooltipContent>
                          </Tooltip>
                        ),
                        rotateRight: (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button icon={<RotateCw />} variant="outline" size="small" />
                            </TooltipTrigger>
                            <TooltipContent>{t('components.ui.image-preview.rotateRight', '向右旋转')}</TooltipContent>
                          </Tooltip>
                        ),
                        zoomIn: (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button icon={<ZoomIn />} variant="outline" size="small" />
                            </TooltipTrigger>
                            <TooltipContent>{t('components.ui.image-preview.zoomIn', '放大')}</TooltipContent>
                          </Tooltip>
                        ),
                        zoomOut: (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button icon={<ZoomOut />} variant="outline" size="small" />
                            </TooltipTrigger>
                            <TooltipContent>{t('components.ui.image-preview.zoomOut', '缩小')}</TooltipContent>
                          </Tooltip>
                        ),
                        flipX: (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button icon={<FlipHorizontal />} variant="outline" size="small" />
                            </TooltipTrigger>
                            <TooltipContent>{t('components.ui.image-preview.flipX', '水平翻转')}</TooltipContent>
                          </Tooltip>
                        ),
                        flipY: (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button icon={<FlipVertical />} variant="outline" size="small" />
                            </TooltipTrigger>
                            <TooltipContent>{t('components.ui.image-preview.flipY', '垂直翻转')}</TooltipContent>
                          </Tooltip>
                        ),
                      },
                      closeIcon: (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button icon={<X />} variant="outline" size="small" />
                          </TooltipTrigger>
                          <TooltipContent>{t('components.ui.image-preview.close', '关闭')}</TooltipContent>
                        </Tooltip>
                      ),
                    }}
                  />
                </div>
                {/* 图片操作按钮 */}
                <div className="mt-4 flex items-center justify-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        icon={<RotateCcw />}
                        variant="outline"
                        size="small"
                        onClick={() => {
                          // 触发图片预览
                          const previewBtn = document.querySelector('.rc-image-preview-wrap');
                          if (!previewBtn) {
                            const imgElement = document.querySelector('.rc-image img') as HTMLElement;
                            imgElement?.click();
                          }
                          // 点击左旋转按钮
                          setTimeout(() => {
                            const rotateLeftBtn = document.querySelector(
                              '.rc-image-preview-operations-operation-rotateLeft',
                            );
                            (rotateLeftBtn as HTMLElement)?.click();
                          }, 100);
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
                          // 触发图片预览
                          const previewBtn = document.querySelector('.rc-image-preview-wrap');
                          if (!previewBtn) {
                            const imgElement = document.querySelector('.rc-image img') as HTMLElement;
                            imgElement?.click();
                          }
                          // 点击右旋转按钮
                          setTimeout(() => {
                            const rotateRightBtn = document.querySelector(
                              '.rc-image-preview-operations-operation-rotateRight',
                            );
                            (rotateRightBtn as HTMLElement)?.click();
                          }, 100);
                        }}
                      />
                    </TooltipTrigger>
                    <TooltipContent>{t('components.ui.image-preview.rotateRight', '向右旋转')}</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        icon={<FlipHorizontal />}
                        variant="outline"
                        size="small"
                        onClick={() => {
                          // 触发图片预览
                          const previewBtn = document.querySelector('.rc-image-preview-wrap');
                          if (!previewBtn) {
                            const imgElement = document.querySelector('.rc-image img') as HTMLElement;
                            imgElement?.click();
                          }
                          // 点击水平翻转按钮
                          setTimeout(() => {
                            const flipXBtn = document.querySelector('.rc-image-preview-operations-operation-flipX');
                            (flipXBtn as HTMLElement)?.click();
                          }, 100);
                        }}
                      />
                    </TooltipTrigger>
                    <TooltipContent>{t('components.ui.image-preview.flipX', '水平翻转')}</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        icon={<FlipVertical />}
                        variant="outline"
                        size="small"
                        onClick={() => {
                          // 触发图片预览
                          const previewBtn = document.querySelector('.rc-image-preview-wrap');
                          if (!previewBtn) {
                            const imgElement = document.querySelector('.rc-image img') as HTMLElement;
                            imgElement?.click();
                          }
                          // 点击垂直翻转按钮
                          setTimeout(() => {
                            const flipYBtn = document.querySelector('.rc-image-preview-operations-operation-flipY');
                            (flipYBtn as HTMLElement)?.click();
                          }, 100);
                        }}
                      />
                    </TooltipTrigger>
                    <TooltipContent>{t('components.ui.image-preview.flipY', '垂直翻转')}</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        icon={<ZoomIn />}
                        variant="outline"
                        size="small"
                        onClick={() => {
                          // 触发图片预览
                          const previewBtn = document.querySelector('.rc-image-preview-wrap');
                          if (!previewBtn) {
                            const imgElement = document.querySelector('.rc-image img') as HTMLElement;
                            imgElement?.click();
                          }
                          // 点击放大按钮
                          setTimeout(() => {
                            const zoomInBtn = document.querySelector('.rc-image-preview-operations-operation-zoomIn');
                            (zoomInBtn as HTMLElement)?.click();
                          }, 100);
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
                          // 触发图片预览
                          const previewBtn = document.querySelector('.rc-image-preview-wrap');
                          if (!previewBtn) {
                            const imgElement = document.querySelector('.rc-image img') as HTMLElement;
                            imgElement?.click();
                          }
                          // 点击缩小按钮
                          setTimeout(() => {
                            const zoomOutBtn = document.querySelector('.rc-image-preview-operations-operation-zoomOut');
                            (zoomOutBtn as HTMLElement)?.click();
                          }, 100);
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
                            // 创建一个a标签在新窗口打开图片
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

          {/* 分隔线 */}
          <div className="border-l border-input"></div>

          {/* 中间区域，渲染表单 */}
          <div className="flex h-full flex-1 flex-col overflow-auto rounded-r-xl rounded-tr-xl p-6">
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
