import { useEffect, useRef, useState } from 'react';

import { ArrowLeft, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import {
  imageGenerate3DModel,
  imageGenerateJson,
  imageGenerateMarkdown,
  imageGenerateTxt,
  threeDImageGenerateJson,
  threeDImageGenerateMarkdown,
  threeDImageGenerateTxt,
  threeDImageUploadImage,
  txtGenerate3DModel,
  txtGenerateImage,
  txtGenerateJson,
  txtGenerateMarkdown,
  updateMediaIcon,
} from '@/apis/media-data';
import { createMediaFile } from '@/apis/resources';
import { VinesResourceSource } from '@/apis/resources/typting.ts';
import { IAssetItem } from '@/apis/ugc/typings.ts';
import { AssetFullContentDisplay } from '@/components/layout/ugc/detail/asset-full-content-display';
import { StepViewer, StepViewerRef } from '@/components/layout/ugc/detail/step-viewer';
import { StepThumbnailGenerator } from '@/components/layout/ugc/step-thumbnail-generator';
import { UgcTagSelector } from '@/components/layout/ugc/view/tag-selector';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card.tsx';
import { VinesMarkdown } from '@/components/ui/markdown';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface IAssetDetailPageProps<E extends object> {
  asset: IAssetItem<E>;
  assetType: string;
  onBack: () => void;
  mutate?: () => Promise<any>;
  hideConversion?: boolean;
}

export const AssetDetailPage = <E extends object>({
  asset,
  assetType,
  onBack,
  mutate,
  hideConversion,
}: IAssetDetailPageProps<E>) => {
  const { t, i18n } = useTranslation();
  const [conversionType, setConversionType] = useState('text');
  const [isGenerating, setIsGenerating] = useState(false);
  const stepViewerRef = useRef<StepViewerRef | null>(null);
  const [pending3DThumb, setPending3DThumb] = useState<{ id: string; url: string; name: string } | null>(null);

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
    description: (() => {
      const desc = (asset as any).description;
      if (!desc) return '';
      if (typeof desc === 'string') return desc;
      // 如果是多语言对象，根据当前语言返回
      if (typeof desc === 'object' && desc !== null) {
        // 优先尝试当前语言，然后尝试 zh-CN，最后尝试 en-US
        if (i18n.language === 'zh') {
          return desc['zh-CN'] || desc['en-US'] || '';
        } else if (i18n.language === 'en') {
          return desc['en-US'] || desc['zh-CN'] || '';
        }
      }
      return desc;
    })(),
    markdownDescription: (asset as any).params?.markdownDescription || '',
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
    const assetType = (asset as any).type;
    // 检查 type 字段或文件扩展名
    return (
      assetType?.startsWith('image') || ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(fileType || '')
    );
  };

  // 判断是否为 STEP 或 GLB 文件
  const isStepFile = () => {
    const fileType = getFileType();
    return ['step', 'stp', 'glb'].includes(fileType || '');
  };

  // 获取预览图片URL
  const previewImageUrl = (asset as any).url || (asset as any).cover || asset.iconUrl || '';

  const uploadBlobImage = async (blob: Blob, fileName: string) => {
    const form = new FormData();
    const file = new File([blob], fileName, { type: 'image/png' });
    const key = `screenshots/${fileName}`;
    form.append('file', file);
    form.append('key', key);

    const res = await fetch('/api/medias/s3/file', {
      method: 'POST',
      body: form,
    });
    const json = await res.json();
    const url = json?.data ?? json?.url;
    if (!url) throw new Error('upload image failed');

    const created = await createMediaFile({
      type: 'image',
      displayName: fileName,
      source: VinesResourceSource.AUTO_GENERATE,
      url,
      tags: [],
      categoryIds: [],
      size: blob.size,
    });
    if (!created) throw new Error('create media failed');
    return { id: (created as any).id as string, url: url as string };
  };

  const captureStepScreenshotAndCreateAsset = async () => {
    const blob = (await stepViewerRef.current?.captureScreenshot()) || null;
    if (!blob) throw new Error('screenshot failed');
    const baseName = String(assetInfo.name).replace(/\.[^.]+$/, '');
    const imageName = `${baseName}_screenshot.png`;
    const { id, url } = await uploadBlobImage(blob, imageName);
    return { id, url } as const;
  };

  const uploadBlobForUrl = async (blob: Blob, fileName: string): Promise<string> => {
    const form = new FormData();
    form.append('file', blob, fileName);
    form.append('key', `step-thumbnails/${Date.now()}_${fileName}`);
    const res = await fetch('/api/medias/s3/file', { method: 'POST', body: form });
    const json = await res.json();
    const url = json?.data ?? json?.url;
    if (!url) throw new Error('upload failed');
    return url as string;
  };

  // 设置默认转换类型
  useEffect(() => {
    if (isImageFile()) {
      setConversionType('text');
    } else if (isStepFile()) {
      setConversionType('image');
    } else if (isTextFile()) {
      setConversionType('image');
    }
  }, [asset]);

  return (
    <div className="flex h-full flex-col bg-white dark:bg-black">
      {pending3DThumb && (
        <StepThumbnailGenerator
          fileUrl={pending3DThumb.url}
          fileName={pending3DThumb.name}
          onComplete={async (blob) => {
            try {
              if (blob) {
                const url = await uploadBlobForUrl(blob, `${pending3DThumb.name.replace(/\.[^.]+$/, '')}_thumb.png`);
                await updateMediaIcon(pending3DThumb.id, url);
                toast.success(t('asset.detail.imageGenerated') || '缩略图已更新');
                if (mutate) await mutate();
              }
            } catch (e) {
              console.error(e);
            } finally {
              setPending3DThumb(null);
            }
          }}
        />
      )}
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
            // 文本文件显示完整内容（使用改进后的AssetFullContentDisplay）
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
            // STEP 或 GLB 文件显示 3D 模型预览
            <StepViewer ref={stepViewerRef} url={previewImageUrl} className="h-full w-full" />
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

              {/* 图片描述区域 */}
              {assetInfo.description && (
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('asset.detail.description')}
                  </label>
                  <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200">
                    {assetInfo.description}
                  </div>
                </div>
              )}

              {/* Markdown 描述区域 */}
              {assetInfo.markdownDescription && (
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('asset.detail.markdownDescription') || 'Markdown 描述'}
                  </label>
                  <div className="max-h-96 overflow-auto rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-900">
                    <VinesMarkdown className="text-sm">{assetInfo.markdownDescription}</VinesMarkdown>
                  </div>
                </div>
              )}
            </CardContent>

            {/* 转换功能区域 */}
            {!hideConversion && (
              <div className="border-t border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-black">
                <div className="flex flex-col gap-3">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('asset.detail.conversion')}
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="whitespace-nowrap rounded bg-gray-100 px-2 py-1 text-sm font-medium text-gray-700 dark:bg-gray-900 dark:text-gray-300">
                      {isTextFile()
                        ? t('asset.detail.conversionTypes.text')
                        : isStepFile()
                          ? t('asset.detail.conversionTypes.3d-model')
                          : t('asset.detail.conversionTypes.image')}
                    </span>
                    <span className="text-gray-400 dark:text-gray-500">→</span>
                    <Select value={conversionType} onValueChange={setConversionType}>
                      <SelectTrigger className="h-8 w-24 border-gray-300 dark:border-gray-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {isTextFile() ? (
                          // JSON 文件的转换选项
                          <>
                            <SelectItem value="image">{t('asset.detail.conversionTypes.image')}</SelectItem>
                            <SelectItem value="symbol-summary">
                              {t('asset.detail.conversionTypes.symbol-summary')}
                            </SelectItem>
                            <SelectItem value="3d-model">{t('asset.detail.conversionTypes.3d-model')}</SelectItem>
                            <SelectItem value="neural-model">
                              {t('asset.detail.conversionTypes.neural-model')}
                            </SelectItem>
                          </>
                        ) : isStepFile() ? (
                          // STEP 文件的转换选项
                          <>
                            <SelectItem value="image">{t('asset.detail.conversionTypes.image')}</SelectItem>
                            <SelectItem value="text">{t('asset.detail.conversionTypes.text')}</SelectItem>
                            <SelectItem value="symbol-summary">
                              {t('asset.detail.conversionTypes.symbol-summary')}
                            </SelectItem>
                            <SelectItem value="neural-model">
                              {t('asset.detail.conversionTypes.neural-model')}
                            </SelectItem>
                          </>
                        ) : isImageFile() ? (
                          // 图片文件的转换选项
                          <>
                            <SelectItem value="text">{t('asset.detail.conversionTypes.text')}</SelectItem>
                            <SelectItem value="symbol-summary">
                              {t('asset.detail.conversionTypes.symbol-summary')}
                            </SelectItem>
                            <SelectItem value="3d-model">{t('asset.detail.conversionTypes.3d-model')}</SelectItem>
                            <SelectItem value="neural-model">
                              {t('asset.detail.conversionTypes.neural-model')}
                            </SelectItem>
                          </>
                        ) : (
                          // 其他文件的转换选项
                          <SelectItem value="text">{t('asset.detail.conversionTypes.text')}</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <Button
                      size="small"
                      className="ml-auto rounded-md bg-black px-4 py-2 font-medium text-white hover:bg-black hover:text-white dark:bg-white dark:text-black"
                      disabled={isGenerating}
                      onClick={async () => {
                        // 当图片转换为文字时，调用 AI 生成描述
                        if (isImageFile() && conversionType === 'text' && mutate) {
                          setIsGenerating(true);
                          try {
                            await imageGenerateTxt(asset.id);
                            toast.success(t('asset.detail.descriptionGenerated'));
                            await mutate();
                          } catch (error: any) {
                            toast.error(t('asset.detail.generateFailed') + ': ' + (error?.message || 'Unknown error'));
                          } finally {
                            setIsGenerating(false);
                          }
                        } else if (isImageFile() && conversionType === '3d-model' && mutate) {
                          // 当图片转换为3D模型时，调用 AI 生成3D模型，并生成缩略图
                          setIsGenerating(true);
                          try {
                            const created3D = await imageGenerate3DModel(asset.id);
                            console.log(created3D?.url);
                            console.log(created3D?.id);
                            console.log(created3D?.displayName);
                            toast.success(t('asset.detail.3dModelGenerated') || '3D模型已生成');
                            if ((created3D as any)?.url && (created3D as any)?.id) {
                              setPending3DThumb({
                                id: (created3D as any).id,
                                url: (created3D as any).url,
                                name: (created3D as any).displayName || 'model.glb',
                              });
                            }
                            await mutate();
                          } catch (error: any) {
                            toast.error(t('asset.detail.generateFailed') + ': ' + (error?.message || 'Unknown error'));
                          } finally {
                            setIsGenerating(false);
                          }
                        } else if (isImageFile() && conversionType === 'symbol-summary' && mutate) {
                          // 当图片转换为 Markdown 时，调用 AI 生成 Markdown 描述
                          setIsGenerating(true);
                          try {
                            await imageGenerateMarkdown(asset.id);
                            toast.success(t('asset.detail.markdownGenerated') || 'Markdown描述已生成');
                            await mutate();
                          } catch (error: any) {
                            toast.error(t('asset.detail.generateFailed') + ': ' + (error?.message || 'Unknown error'));
                          } finally {
                            setIsGenerating(false);
                          }
                        } else if (isImageFile() && conversionType === 'neural-model' && mutate) {
                          // 当图片转换为神经模型时，调用 AI 生成 JSON
                          setIsGenerating(true);
                          try {
                            // 获取文件名（不含扩展名）
                            const jsonFileName = assetInfo.name.replace(/\.[^.]+$/, '');
                            await imageGenerateJson(asset.id, jsonFileName);
                            toast.success(t('asset.detail.neuralModelGenerated') || '神经模型已生成');
                            await mutate();
                          } catch (error: any) {
                            toast.error(t('asset.detail.generateFailed') + ': ' + (error?.message || 'Unknown error'));
                          } finally {
                            setIsGenerating(false);
                          }
                        } else if (isTextFile() && conversionType === 'image' && mutate) {
                          // 当文本转换为图片时，读取文本内容并生成图片
                          setIsGenerating(true);
                          try {
                            const response = await fetch((asset as any).url);
                            const text = await response.text();
                            const textPreview = text.substring(0, 100);

                            // 获取 JSON 文件名（不含扩展名）
                            const jsonFileName = assetInfo.name.replace(/\.[^.]+$/, '');

                            await txtGenerateImage(asset.id, textPreview, jsonFileName);
                            toast.success(t('asset.detail.imageGenerated') || '图片已生成');
                            await mutate();
                          } catch (error: any) {
                            toast.error(t('asset.detail.generateFailed') + ': ' + (error?.message || 'Unknown error'));
                          } finally {
                            setIsGenerating(false);
                          }
                        } else if (isTextFile() && conversionType === 'symbol-summary' && mutate) {
                          // 当文本转换为 Markdown 时，读取文本内容并生成 Markdown
                          setIsGenerating(true);
                          try {
                            const response = await fetch((asset as any).url);
                            const text = await response.text();
                            const textPreview = text.substring(0, 100);

                            // 获取 JSON 文件名（不含扩展名）
                            const jsonFileName = assetInfo.name.replace(/\.[^.]+$/, '');

                            await txtGenerateMarkdown(asset.id, textPreview, jsonFileName);
                            toast.success(t('asset.detail.markdownGenerated') || 'Markdown描述已生成');
                            await mutate();
                          } catch (error: any) {
                            toast.error(t('asset.detail.generateFailed') + ': ' + (error?.message || 'Unknown error'));
                          } finally {
                            setIsGenerating(false);
                          }
                        } else if (isTextFile() && conversionType === '3d-model' && mutate) {
                          // 当文本转换为3D模型时，读取文本内容并生成3D模型
                          setIsGenerating(true);
                          try {
                            const response = await fetch((asset as any).url);
                            const text = await response.text();
                            const textPreview = text.substring(0, 100);

                            // 获取 JSON 文件名（不含扩展名）
                            const jsonFileName = assetInfo.name.replace(/\.[^.]+$/, '');

                            const created3D = await txtGenerate3DModel(asset.id, textPreview, jsonFileName);
                            toast.success(t('asset.detail.3dModelGenerated') || '3D模型已生成');
                            if ((created3D as any)?.url && (created3D as any)?.id) {
                              setPending3DThumb({
                                id: (created3D as any).id,
                                url: (created3D as any).url,
                                name: (created3D as any).displayName || 'model.glb',
                              });
                            }
                            await mutate();
                          } catch (error: any) {
                            toast.error(t('asset.detail.generateFailed') + ': ' + (error?.message || 'Unknown error'));
                          } finally {
                            setIsGenerating(false);
                          }
                        } else if (isTextFile() && conversionType === 'json' && mutate) {
                          // 当文本转换为 JSON 时，读取文本内容并生成 JSON
                          setIsGenerating(true);
                          try {
                            const response = await fetch((asset as any).url);
                            const text = await response.text();
                            const textPreview = text.substring(0, 100);
                            const jsonFileName = assetInfo.name.replace(/\.[^.]+$/, '');
                            await txtGenerateJson(asset.id, textPreview, jsonFileName);
                            toast.success(t('asset.detail.jsonGenerated') || 'JSON已生成');
                            await mutate();
                          } catch (error: any) {
                            toast.error(t('asset.detail.generateFailed') + ': ' + (error?.message || 'Unknown error'));
                          } finally {
                            setIsGenerating(false);
                          }
                        } else if (isStepFile() && conversionType === 'image' && mutate) {
                          // 3D 文件：生成图片（通过截图）
                          setIsGenerating(true);
                          try {
                            const { url: imageUrl } = await captureStepScreenshotAndCreateAsset();
                            await threeDImageUploadImage(asset.id, imageUrl);
                            toast.success(t('asset.detail.imageGenerated') || '图片已生成');
                            await mutate();
                          } catch (error: any) {
                            toast.error(t('asset.detail.generateFailed') + ': ' + (error?.message || 'Unknown error'));
                          } finally {
                            setIsGenerating(false);
                          }
                        } else if (isStepFile() && conversionType === 'text' && mutate) {
                          // 3D 文件：先截图生成图片，再按图片转文本
                          setIsGenerating(true);
                          try {
                            const { url: imageUrl } = await captureStepScreenshotAndCreateAsset();
                            await threeDImageGenerateTxt(asset.id, imageUrl);
                            toast.success(t('asset.detail.descriptionGenerated'));
                            await mutate();
                          } catch (error: any) {
                            toast.error(t('asset.detail.generateFailed') + ': ' + (error?.message || 'Unknown error'));
                          } finally {
                            setIsGenerating(false);
                          }
                        } else if (isStepFile() && conversionType === 'symbol-summary' && mutate) {
                          // 3D 文件：先截图，再按图片转 Markdown
                          setIsGenerating(true);
                          try {
                            const { url: imageUrl } = await captureStepScreenshotAndCreateAsset();
                            await threeDImageGenerateMarkdown(asset.id, imageUrl);
                            toast.success(t('asset.detail.markdownGenerated') || 'Markdown描述已生成');
                            await mutate();
                          } catch (error: any) {
                            toast.error(t('asset.detail.generateFailed') + ': ' + (error?.message || 'Unknown error'));
                          } finally {
                            setIsGenerating(false);
                          }
                        } else if (isStepFile() && conversionType === 'neural-model' && mutate) {
                          // 3D 文件：先截图，再按图片转 JSON 神经模型
                          setIsGenerating(true);
                          try {
                            const { url: imageUrl } = await captureStepScreenshotAndCreateAsset();
                            const jsonFileName = assetInfo.name.replace(/\.[^.]+$/, '');
                            await threeDImageGenerateJson(asset.id, imageUrl, jsonFileName);
                            toast.success(t('asset.detail.neuralModelGenerated') || '神经模型已生成');
                            await mutate();
                          } catch (error: any) {
                            toast.error(t('asset.detail.generateFailed') + ': ' + (error?.message || 'Unknown error'));
                          } finally {
                            setIsGenerating(false);
                          }
                        } else {
                          console.log('开始转换:', conversionType);
                        }
                      }}
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                          {t('asset.detail.generating')}
                        </>
                      ) : (
                        t('asset.detail.startConversion')
                      )}
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
