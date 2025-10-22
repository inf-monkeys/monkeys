import { useState } from 'react';

import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { IAssetItem } from '@/apis/ugc/typings.ts';
import { AssetFullContentDisplay } from '@/components/layout/ugc/detail/asset-full-content-display';
import { StepViewer } from '@/components/layout/ugc/detail/step-viewer';
import { UgcTagSelector } from '@/components/layout/ugc/view/tag-selector';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card.tsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface IAssetDetailPageProps<E extends object> {
  asset: IAssetItem<E>;
  assetType: string;
  onBack: () => void;
  mutate?: () => Promise<any>;
}

export const AssetDetailPage = <E extends object>({ asset, assetType, onBack, mutate }: IAssetDetailPageProps<E>) => {
  const { t } = useTranslation();
  const [conversionType, setConversionType] = useState('text');

  // 获取资产的基本信息
  const assetInfo = {
    name: asset.name || (asset as any).displayName || t('asset.detail.unknownName'),
    fileSize: (asset as any).size
      ? `${((asset as any).size / 1024 / 1024).toFixed(1)}MB`
      : t('asset.detail.unknownSize'),
    fileFormat: (asset as any).type?.toUpperCase() || t('asset.detail.unknownFormat'),
    creator: (asset as any).user?.name || t('asset.detail.unknownCreator'),
    uploadTime: asset.createdTimestamp
      ? new Date(asset.createdTimestamp).toLocaleDateString('zh-CN')
      : t('asset.detail.unknownTime'),
    updateTime: asset.updatedTimestamp
      ? new Date(asset.updatedTimestamp).toLocaleDateString('zh-CN')
      : t('asset.detail.unknownTime'),
  };

  // 获取文件类型
  const getFileType = () => {
    const fileName = assetInfo.name;
    const extension = fileName.split('.').pop()?.toLowerCase();
    return extension;
  };

  // 判断是否为文本文件
  const isTextFile = () => {
    const fileType = getFileType();
    return ['txt', 'json', 'md', 'csv', 'log', 'xml', 'yaml', 'yml'].includes(fileType || '');
  };

  // 判断是否为图片文件
  const isImageFile = () => {
    const fileType = getFileType();
    return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(fileType || '');
  };

  // 判断是否为 STEP 文件
  const isStepFile = () => {
    const fileType = getFileType();
    return ['step', 'stp'].includes(fileType || '');
  };

  // 获取预览图片URL
  const previewImageUrl = (asset as any).url || (asset as any).cover || asset.iconUrl || '';

  return (
    <div className="flex h-full flex-col bg-white dark:bg-black">
      {/* 头部导航 */}
      <div className="flex items-center gap-4 border-b border-gray-200 p-4 dark:border-gray-800">
        <Button variant="ghost" size="small" onClick={onBack} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          <span>{t('asset.detail.back')}</span>
        </Button>
      </div>

      {/* 主内容区域 */}
      <div className="flex flex-1 gap-6 overflow-hidden p-6">
        {/* 左侧预览区域 */}
        <div className="flex-1">
          {isTextFile() ? (
            // 文本文件显示完整内容
            <AssetFullContentDisplay asset={asset} className="h-full w-full" />
          ) : isImageFile() && previewImageUrl ? (
            // 图片文件显示图片预览
            <div className="flex h-full items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-black">
              <img
                src={previewImageUrl}
                alt={assetInfo.name}
                className="h-auto max-h-full w-auto max-w-full object-contain"
                style={{ maxWidth: 'calc(100% - 2rem)', maxHeight: 'calc(100% - 2rem)' }}
              />
            </div>
          ) : isStepFile() && previewImageUrl ? (
            // STEP 文件显示 3D 模型预览
            <StepViewer url={previewImageUrl} className="h-full w-full" />
          ) : (
            // 其他文件类型显示默认预览
            <div className="flex h-full items-center justify-center rounded-lg border border-gray-200 bg-white p-8 dark:border-gray-800 dark:bg-black">
              <div className="text-center">
                <div className="mb-2 text-lg font-medium text-gray-500 dark:text-gray-400">{assetInfo.fileFormat}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{t('asset.detail.previewNotSupported')}</div>
              </div>
            </div>
          )}
        </div>

        {/* 右侧信息区域 */}
        <div className="flex w-96 flex-col">
          <Card className="flex flex-1 flex-col overflow-hidden">
            <CardHeader className="pb-4">
              <h2 className="text-lg font-semibold dark:text-gray-100">{t('asset.detail.info')}</h2>
            </CardHeader>
            <CardContent className="flex-1 space-y-6 overflow-auto">
              {/* 基本信息字段 */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('asset.detail.name')}
                    </label>
                    <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200">
                      {assetInfo.name}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('asset.detail.fileSize')}
                    </label>
                    <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200">
                      {assetInfo.fileSize}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('asset.detail.fileFormat')}
                    </label>
                    <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200">
                      {assetInfo.fileFormat}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('asset.detail.creator')}
                    </label>
                    <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200">
                      {assetInfo.creator}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('asset.detail.uploadTime')}
                    </label>
                    <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200">
                      {assetInfo.uploadTime}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('asset.detail.updateTime')}
                    </label>
                    <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200">
                      {assetInfo.updateTime}
                    </div>
                  </div>
                </div>
              </div>

              {/* 标签区域 */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('asset.detail.tags')}</label>
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
                        className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800 dark:bg-gray-800 dark:text-gray-200"
                      >
                        {tag.name}
                      </span>
                    )) || <span className="text-sm text-gray-500 dark:text-gray-400">{t('asset.detail.noTags')}</span>}
                  </div>
                )}
              </div>
            </CardContent>

            {/* 转换功能区域 - 只在非文本文件且非 STEP 文件时显示 */}
            {!isTextFile() && !isStepFile() && (
              <div className="border-t border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-black">
                <div className="flex flex-col gap-3">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('asset.detail.conversion')}
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="whitespace-nowrap rounded bg-gray-100 px-2 py-1 text-sm font-medium text-gray-700 dark:bg-gray-900 dark:text-gray-300">
                      {t('asset.detail.imageToText')}
                    </span>
                    <span className="text-gray-400 dark:text-gray-500">→</span>
                    <Select value={conversionType} onValueChange={setConversionType}>
                      <SelectTrigger className="h-8 w-24 border-gray-300 dark:border-gray-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">{t('asset.detail.conversionTypes.text')}</SelectItem>
                        <SelectItem value="symbol-summary">
                          {t('asset.detail.conversionTypes.symbol-summary')}
                        </SelectItem>
                        <SelectItem value="3d-model">{t('asset.detail.conversionTypes.3d-model')}</SelectItem>
                        <SelectItem value="neural-model">{t('asset.detail.conversionTypes.neural-model')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      size="small"
                      className="ml-auto rounded-md bg-black px-4 py-2 font-medium text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-100"
                      onClick={() => {
                        console.log('开始转换:', conversionType);
                      }}
                    >
                      {t('asset.detail.startConversion')}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
