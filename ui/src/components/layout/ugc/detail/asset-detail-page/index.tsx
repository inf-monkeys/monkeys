import React, { useState } from 'react';

import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { IAssetItem } from '@/apis/ugc/typings.ts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card.tsx';
import { UgcTagSelector } from '@/components/layout/ugc/view/tag-selector';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/utils';

interface IAssetDetailPageProps<E extends object> {
  asset: IAssetItem<E>;
  assetType: string;
  onBack: () => void;
  mutate?: () => Promise<any>;
}

export const AssetDetailPage = <E extends object>({
  asset,
  assetType,
  onBack,
  mutate,
}: IAssetDetailPageProps<E>) => {
  const { t } = useTranslation();
  const [conversionType, setConversionType] = useState('text');

  // 获取资产的基本信息
  const assetInfo = {
    name: asset.name || (asset as any).displayName || '未知名称',
    fileSize: (asset as any).size ? `${((asset as any).size / 1024 / 1024).toFixed(1)}MB` : '未知大小',
    fileFormat: (asset as any).type?.toUpperCase() || '未知格式',
    creator: (asset as any).user?.name || '未知创建者',
    uploadTime: asset.createdTimestamp ? new Date(asset.createdTimestamp).toLocaleDateString('zh-CN') : '未知时间',
    updateTime: asset.updatedTimestamp ? new Date(asset.updatedTimestamp).toLocaleDateString('zh-CN') : '未知时间',
  };

  // 获取预览图片URL
  const previewImageUrl = (asset as any).url || (asset as any).cover || asset.iconUrl || '';

  return (
    <div className="flex flex-col h-full bg-white dark:bg-black">
      {/* 头部导航 */}
      <div className="flex items-center gap-4 border-b border-gray-200 dark:border-gray-800 p-4">
        <Button
          variant="ghost"
          size="small"
          onClick={onBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>资产详情</span>
        </Button>
      </div>

      {/* 主内容区域 */}
      <div className="flex flex-1 gap-6 p-6 overflow-hidden">
        {/* 左侧预览区域 */}
        <div className="flex-1">
          <Card className="h-full flex flex-col">
            <CardContent className="flex-1 flex items-center justify-center p-8 overflow-auto">
              {previewImageUrl ? (
                <img
                  src={previewImageUrl}
                  alt={assetInfo.name}
                  className="max-w-[80%] object-contain"
                />
              ) : (
                <div className="flex h-64 w-full items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                  暂无预览图片
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 右侧信息区域 */}
        <div className="w-96 flex flex-col">
          <Card className="flex-1 flex flex-col overflow-hidden">
            <CardHeader className="pb-4">
              <h2 className="text-lg font-semibold dark:text-gray-100">资产信息</h2>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto space-y-6">
              {/* 基本信息字段 */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">名称</label>
                    <div className="rounded-md border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm dark:text-gray-200">
                      {assetInfo.name}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">文件大小</label>
                    <div className="rounded-md border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm dark:text-gray-200">
                      {assetInfo.fileSize}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">文件格式</label>
                    <div className="rounded-md border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm dark:text-gray-200">
                      {assetInfo.fileFormat}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">创建人</label>
                    <div className="rounded-md border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm dark:text-gray-200">
                      {assetInfo.creator}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">上传时间</label>
                    <div className="rounded-md border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm dark:text-gray-200">
                      {assetInfo.uploadTime}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">更新时间</label>
                    <div className="rounded-md border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm dark:text-gray-200">
                      {assetInfo.updateTime}
                    </div>
                  </div>
                </div>
              </div>

              {/* 标签区域 */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">标签</label>
                {mutate ? (
                  <UgcTagSelector
                    assetId={asset.id}
                    assetType={assetType as any}
                    assetTags={(asset as any).assetTags}
                    mutate={mutate}
                  />
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {(asset as any).assetTags?.map((tag: any, index: number) => (
                      <span
                        key={index}
                        className="rounded-full bg-blue-100 dark:bg-gray-800 px-2 py-1 text-xs text-blue-800 dark:text-gray-200"
                      >
                        {tag.name}
                      </span>
                    )) || (
                      <span className="text-sm text-gray-500 dark:text-gray-400">暂无标签</span>
                    )}
                  </div>
                )}
              </div>
            </CardContent>

            {/* 转换功能区域 - 固定在右侧栏最底部 */}
            <div className="border-t border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-black">
              <div className="flex flex-col gap-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">转换</label>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded whitespace-nowrap">图片</span>
                  <span className="text-gray-400 dark:text-gray-500">→</span>
                  <Select value={conversionType} onValueChange={setConversionType}>
                    <SelectTrigger className="w-24 h-8 border-gray-300 dark:border-gray-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">文本</SelectItem>
                      <SelectItem value="symbol-summary">符号概括</SelectItem>
                      <SelectItem value="3d-model">3D模型</SelectItem>
                      <SelectItem value="neural-model">神经模型</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    size="small"
                    className="ml-auto bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100 px-4 py-2 rounded-md font-medium"
                    onClick={() => {
                      console.log('开始转换:', conversionType);
                    }}
                  >
                    开始转换
                  </Button>
                </div>
              </div>
            </div>

          </Card>
        </div>
      </div>
    </div>
  );
};