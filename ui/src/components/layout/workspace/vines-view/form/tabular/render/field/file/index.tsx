import React, { useEffect } from 'react';

import { isArray, isString } from 'lodash';
import { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card.tsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { VinesImageMaskPreview } from '@/components/ui/image-editor/mask/preview.tsx';
import { VinesUploader } from '@/components/ui/vines-uploader';
import useUrlState from '@/hooks/use-url-state.ts';
import { useVinesFlow } from '@/package/vines-flow';
import { VinesWorkflowVariable } from '@/package/vines-flow/core/tools/typings.ts';
import { IWorkflowInputForm } from '@/schema/workspace/workflow-input-form.ts';
import { cn } from '@/utils';
import { COMMON_ASPECT_RATIOS, detectAspectRatioFromUrl } from '@/utils/file.ts';

interface IFieldFileProps {
  input: VinesWorkflowVariable;
  form: UseFormReturn<IWorkflowInputForm>;
  value: any;
  originalInputImages?: string[]; // 添加原始输入图片属性

  miniMode?: boolean;
}

export const FieldFile: React.FC<IFieldFileProps> = ({
  value,
  input: { name, type, typeOptions },
  form,
  miniMode = false,
  originalInputImages = [],
}) => {
  const { t } = useTranslation();

  const { vines } = useVinesFlow();

  const [{ mode }] = useUrlState<{ mode: 'normal' | 'fast' | 'mini' }>({ mode: 'normal' });

  // 监听从画板添加图片的事件
  useEffect(() => {
    const handleAddImageToField = (event: any) => {
      const { fieldName, imageUrl } = event.detail || {};

      // 检查是否是针对当前字段的事件
      if (fieldName === name && imageUrl) {
        const isMultiple = typeOptions?.multipleValues;

        if (isMultiple) {
          // 多选模式：将新图片添加到现有数组中
          const currentValues = isArray(value) ? value : value ? [value] : [];
          const newValues = [...currentValues, imageUrl];
          form.setValue(name, newValues);
        } else {
          // 单选模式：直接替换现有值
          form.setValue(name, imageUrl);
        }
      }
    };

    window.addEventListener('vines:add-image-to-field', handleAddImageToField);

    return () => {
      window.removeEventListener('vines:add-image-to-field', handleAddImageToField);
    };
  }, [name, form, typeOptions?.multipleValues, value]);

  // 获取typeOptions中的原始文件
  const typeOptionsOriginalFiles = typeOptions?.originalFiles as string[] | undefined;

  // 合并所有可能的原始图片来源
  const allOriginalImages = React.useMemo(() => {
    const images = new Set<string>();

    // 添加从props传入的原始图片
    if (originalInputImages && originalInputImages.length > 0) {
      originalInputImages.forEach((img) => images.add(img));
      // console.log(`FieldFile(${name}): 从props获取原始图片:`, originalInputImages);
    }

    // 添加从typeOptions传入的原始图片
    if (typeOptionsOriginalFiles && typeOptionsOriginalFiles.length > 0) {
      typeOptionsOriginalFiles.forEach((img) => images.add(img));
      // console.log(`FieldFile(${name}): 从typeOptions获取原始图片:`, typeOptionsOriginalFiles);
    }

    // 如果value是字符串且看起来像URL，也添加它
    if (
      typeof value === 'string' &&
      (value.startsWith('http') ||
        value.startsWith('/') ||
        value.includes('.jpg') ||
        value.includes('.png') ||
        value.includes('/monkeys/'))
    ) {
      images.add(value);
    }

    // 如果value是数组，添加所有看起来像URL的字符串
    if (Array.isArray(value)) {
      const urlsFromValue: string[] = [];
      value.forEach((item) => {
        if (
          typeof item === 'string' &&
          (item.startsWith('http') ||
            item.startsWith('/') ||
            item.includes('.jpg') ||
            item.includes('.png') ||
            item.includes('/monkeys/'))
        ) {
          images.add(item);
          urlsFromValue.push(item);
        }
      });
      // if (urlsFromValue.length > 0) {
      //   console.log(`FieldFile(${name}): 从value数组获取原始图片:`, urlsFromValue);
      // }
    }

    const result = Array.from(images);
    // console.log(`FieldFile(${name}): 合并后的原始图片:`, result);
    return result;
  }, [name, originalInputImages, typeOptionsOriginalFiles, value]);

  const isMultiple = typeOptions?.multipleValues ?? false;

  const enableImageMask = typeOptions?.enableImageMask ?? false;

  // 自动检测宽高比配置
  const autoDetectAspectRatio = typeOptions?.autoDetectAspectRatio ?? false;
  const aspectRatioField = typeOptions?.aspectRatioField ?? 'aspect_ratio';

  // 处理文件上传变化，自动检测宽高比
  const handleFilesChange = async (urls: string[]) => {
    // 先更新文件字段的值
    form.setValue(name, isMultiple ? urls : urls[0]);

    // 如果启用了自动检测宽高比且有图片上传
    if (autoDetectAspectRatio && urls.length > 0) {
      try {
        // 只检测第一张图片的宽高比
        const firstImageUrl = urls[0];
        let aspectRatio = await detectAspectRatioFromUrl(firstImageUrl);

        // 查找 aspect_ratio 字段的定义，获取可用选项列表
        const aspectRatioInput = vines?.workflowInput?.find((input) => input.name === aspectRatioField);
        const selectList = aspectRatioInput?.typeOptions?.selectList as Array<{
          value: string | number;
          label: string | Record<string, string>;
        }>;

        // 如果有选项列表，检查检测到的值是否在列表中
        if (selectList && selectList.length > 0) {
          const availableValues = selectList.map((item) => item.value?.toString());

          // 如果检测到的宽高比不在可用选项中，找到最接近的选项
          if (!availableValues.includes(aspectRatio)) {
            console.log(
              `Detected aspect ratio "${aspectRatio}" not in available options, finding closest match...`,
            );

            // 将宽高比字符串转换为数值进行比较
            const parseRatio = (ratioStr: string): number => {
              const [w, h] = ratioStr.split(':').map(Number);
              return h > 0 ? w / h : 1;
            };

            const detectedRatioValue = parseRatio(aspectRatio);

            // 查找最接近的可用选项
            let closestOption = availableValues[0];
            let minDifference = Math.abs(detectedRatioValue - parseRatio(closestOption));

            for (const option of availableValues) {
              const optionRatioValue = parseRatio(option);
              const difference = Math.abs(detectedRatioValue - optionRatioValue);

              if (difference < minDifference) {
                minDifference = difference;
                closestOption = option;
              }
            }

            aspectRatio = closestOption;
            console.log(`Using closest available option: "${aspectRatio}"`);
          }
        }

        // 设置宽高比字段的值
        form.setValue(aspectRatioField, aspectRatio);

        console.log(`Auto-detected aspect ratio: ${aspectRatio} for field ${aspectRatioField}`);
      } catch (error) {
        console.error('Failed to auto-detect aspect ratio:', error);
        toast.error('无法自动检测图片宽高比');
      }
    }
  };

  // 调试信息
  // React.useEffect(() => {
  //   console.log(`FieldFile(${name}): 合并后的原始图片:`, allOriginalImages);
  // }, [name, allOriginalImages]);

  return (
    type === 'file' &&
    (miniMode ? (
      <>
        {enableImageMask ? (
          <div className="flex items-center justify-between">
            <span className="text-xs text-opacity-70">
              {t('workspace.pre-view.actuator.execution-form.file.label')}
            </span>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="small" className="-mr-1 scale-90">
                  {t('workspace.pre-view.actuator.execution-form.file.click-to-open-in-image-mask-editor-and-upload')}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[35rem]">
                <DialogHeader>
                  <DialogTitle>{t('components.ui.vines-image-mask-editor.preview.label')}</DialogTitle>
                </DialogHeader>
                <VinesImageMaskPreview
                  src={value}
                  onFinished={(val) => form.setValue(name, isMultiple ? [val] : val)}
                />
              </DialogContent>
            </Dialog>
          </div>
        ) : (
          <div
            className="flex items-center justify-between"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
          >
            <span className="text-xs text-opacity-70">
              {t('workspace.pre-view.actuator.execution-form.file.label')}
            </span>
            <VinesUploader
              files={isArray(value) ? value : isString(value) ? [value] : []}
              originalFiles={allOriginalImages.length > 0 ? allOriginalImages : undefined}
              onChange={handleFilesChange}
              max={isMultiple ? void 0 : 1}
              basePath="user-files/workflow-input"
            />
          </div>
        )}
      </>
    ) : (
      <Card className={cn('w-full overflow-hidden', mode !== 'mini' && 'max-sm:max-w-[calc(100vw-3rem)]')}>
        <CardContent
          className="relative p-0"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
        >
          {enableImageMask ? (
            <VinesImageMaskPreview
              className="p-2"
              src={value}
              onFinished={(val) => form.setValue(name, isMultiple ? [val] : val)}
            />
          ) : (
            <div
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
            >
              <VinesUploader
                files={isArray(value) ? value : isString(value) ? [value] : []}
                originalFiles={allOriginalImages.length > 0 ? allOriginalImages : undefined}
                onChange={handleFilesChange}
                max={isMultiple ? void 0 : 1}
                basePath="user-files/workflow-input"
              />
            </div>
          )}
        </CardContent>
      </Card>
    ))
  );
};
