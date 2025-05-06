import React from 'react';

import { createLazyFileRoute, useRouter } from '@tanstack/react-router';

import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useWorkflowExecutionOutputs } from '@/apis/workflow/execution';
import { IVinesExecutionResultItem } from '@/components/layout/workspace/vines-view/form/execution-result/virtua/item';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { VinesImage } from '@/components/ui/vines-image';
import useUrlState from '@/hooks/use-url-state';

interface IImageDetailProps {}

export const ImageDetail: React.FC<IImageDetailProps> = () => {
  const { t } = useTranslation();
  const { history } = useRouter();

  // 从URL参数中获取图片信息
  const [{ imageUrl, instanceId, outputIndex }] = useUrlState<{
    imageUrl: string;
    instanceId: string;
    outputIndex: number;
  }>({
    imageUrl: '',
    instanceId: '',
    outputIndex: 0,
  });

  const { workflowId } = Route.useParams();

  // 获取执行结果详情
  const { data: executionData } = useWorkflowExecutionOutputs(workflowId, 1, 100);
  const outputItem = React.useMemo(() => {
    if (!executionData?.data || !instanceId) return null;
    // 转换为 IVinesExecutionResultItem 类型
    const item = executionData.data.find((item) => item.instanceId === instanceId);
    if (!item) return null;

    return {
      ...item,
      render: {
        type: 'image',
        data: imageUrl,
        index: outputIndex,
        status: item.status,
      },
    } as IVinesExecutionResultItem;
  }, [executionData, instanceId, imageUrl, outputIndex]);

  // 提取图片参数信息
  const imageParams = React.useMemo(() => {
    if (!outputItem) return {};

    // 从输出中提取参数信息
    const params: Record<string, any> = {};

    // 如果有alt信息，解析它
    if (outputItem.render?.alt) {
      const alt = outputItem.render.alt;
      if (typeof alt === 'string') {
        params.description = alt;
      } else if (typeof alt === 'object') {
        // 处理对象形式的alt
        Object.entries(alt).forEach(([key, value]) => {
          if (typeof value === 'string') {
            params[key] = value;
          } else if (typeof value === 'object' && value.label) {
            params[value.label] = value.data;
          }
        });
      }
    }

    // 添加基本信息
    params.instanceId = outputItem.instanceId;
    params.status = outputItem.status;
    params.createTime = outputItem.createTime;
    params.startTime = outputItem.startTime;
    params.endTime = outputItem.endTime;

    return params;
  }, [outputItem]);

  return (
    <main className="flex size-full flex-col bg-background">
      {/* 顶部导航栏 */}
      <header className="flex h-14 items-center justify-between border-b border-input px-4">
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                icon={<ArrowLeft />}
                variant="ghost"
                size="icon"
                onClick={() => {
                  history.back();
                }}
              />
            </TooltipTrigger>
            <TooltipContent>{t('common.utils.back')}</TooltipContent>
          </Tooltip>
          <h1 className="line-clamp-1 text-lg font-medium">{t('workspace.image-detail.title', '图片详情')}</h1>
        </div>
      </header>

      {/* 主要内容区域 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 左侧大图区域 */}

        <div className="flex flex-1 items-center justify-center overflow-hidden bg-slate-50 p-6">
          {imageUrl ? (
            <div className="relative max-h-full max-w-full overflow-hidden rounded-md shadow-md">
              <VinesImage
                src={imageUrl}
                alt="详情图片"
                className="max-h-[calc(100vh-120px)] max-w-full object-contain"
              />
              <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-2 bg-gradient-to-t from-black/30 to-transparent p-2 opacity-0 transition-opacity hover:opacity-100">
                <Button variant="outline" size="small" className="bg-white/80 hover:bg-white">
                  {t('common.utils.download.label', '下载')}
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center text-muted-foreground">
              {t('workspace.image-detail.no-image', '无图片数据')}
            </div>
          )}
        </div>

        {/* 右侧参数信息区域 */}
        <div className="w-80 shrink-0 overflow-auto border-l border-input bg-white">
          <div className="sticky top-0 border-b border-input bg-white p-4">
            <h2 className="text-lg font-medium">{t('workspace.image-detail.params', '图片参数')}</h2>
          </div>

          <div className="p-4">
            {Object.keys(imageParams).length > 0 ? (
              <div className="flex flex-col gap-4">
                {Object.entries(imageParams).map(([key, value]) => {
                  // 格式化时间戳
                  let displayValue = String(value);
                  if (key.includes('Time') && typeof value === 'number') {
                    const date = new Date(value);
                    displayValue = date.toLocaleString();
                  }

                  return (
                    <div key={key} className="rounded-md border border-input bg-slate-50 p-3">
                      <div className="mb-1 text-xs font-medium uppercase text-slate-500">{key}</div>
                      <div className="break-words text-sm">{displayValue}</div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="mt-8 text-center text-muted-foreground">
                {t('workspace.image-detail.no-params', '无参数数据')}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export const Route = createLazyFileRoute('/$teamId/workspace/$workflowId/image-detail/')({
  component: ImageDetail,
});
