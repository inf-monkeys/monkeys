import React from 'react';

import { createLazyFileRoute, useParams, useRouter } from '@tanstack/react-router';

import { useEventEmitter } from 'ahooks';
import { ArrowLeft, DeleteIcon, DownloadIcon, Share2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import ImageDetailLayout from '@/components/layout/image-detail-layout';
import { TabularRender, TTabularEvent } from '@/components/layout/workspace/vines-view/form/tabular/render';
import { Button } from '@/components/ui/button';
import { VinesFlowProvider } from '@/components/ui/vines-iframe/view/vines-flow-provider';
import { VinesImage } from '@/components/ui/vines-image';
import { useVinesFlow } from '@/package/vines-flow';

interface IImageDetailProps {}

interface TabularRenderWrapperProps {
  height: number;
}

// TabularRender包装组件，用于获取工作流输入参数
const TabularRenderWrapper: React.FC<TabularRenderWrapperProps> = ({ height }) => {
  const { vines } = useVinesFlow();
  const tabular$ = useEventEmitter<TTabularEvent>();

  // 从vines中获取工作流输入参数
  const inputs = vines.workflowInput;
  const workflowId = vines.workflowId;

  return (
    <TabularRender
      inputs={inputs}
      height={height}
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

  return (
    <VinesFlowProvider workflowId={workflowId}>
      <ImageDetailLayout>
        {/* 顶部导航栏可选，三栏布局如下 */}
        <main className="flex size-full flex-col bg-background">
          {/* 主要内容区域 */}
          <div className="flex flex-1 overflow-hidden">
            {/* 左侧图片展示区 */}
            <div className="flex w-[800px] items-center justify-center bg-slate-50 p-6">
              {imageUrl ? (
                <div className="relative max-h-full max-w-full overflow-hidden rounded-md shadow-md">
                  <VinesImage
                    src={imageUrl}
                    alt="详情图片"
                    className="max-h-[calc(100vh-120px)] max-w-full object-contain"
                  />
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  {t('workspace.image-detail.no-image', '无图片数据')}
                </div>
              )}
            </div>

            {/* 中间区域，渲染表单 */}
            <div className="flex-1 overflow-auto p-6">
              <TabularRenderWrapper height={600} />
            </div>

            {/* 右侧操作按钮区 */}
            <div className="flex w-28 shrink-0 flex-col items-center justify-center gap-4 border-l border-input bg-white">
              <Button icon={<ArrowLeft />} variant="outline" size="small" onClick={() => history.back()} />
              <Button icon={<DownloadIcon />} variant="outline" size="small" />
              <Button icon={<DeleteIcon />} variant="outline" size="small" />
              <Button icon={<Share2 />} variant="outline" size="small" />
              {/* <Button icon={displayModeIcon} variant="outline" size="small" /> */}
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
