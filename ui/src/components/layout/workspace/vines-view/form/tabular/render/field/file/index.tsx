import React from 'react';

import { isArray, isString } from 'lodash';
import { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card.tsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { VinesImageMaskPreview } from '@/components/ui/image-editor/mask/preview.tsx';
import { VinesUploader } from '@/components/ui/vines-uploader';
import useUrlState from '@/hooks/use-url-state.ts';
import { VinesWorkflowVariable } from '@/package/vines-flow/core/tools/typings.ts';
import { IWorkflowInputForm } from '@/schema/workspace/workflow-input-form.ts';
import { cn } from '@/utils';

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

  const [{ mode }] = useUrlState<{ mode: 'normal' | 'fast' | 'mini' }>({ mode: 'normal' });

  // 获取typeOptions中的原始文件
  const typeOptionsOriginalFiles = typeOptions?.originalFiles as string[] | undefined;

  // 合并所有可能的原始图片来源
  const allOriginalImages = React.useMemo(() => {
    const images = new Set<string>();

    // 添加从props传入的原始图片
    if (originalInputImages && originalInputImages.length > 0) {
      originalInputImages.forEach(img => images.add(img));
      console.log(`FieldFile(${name}): 从props获取原始图片:`, originalInputImages);
    }

    // 添加从typeOptions传入的原始图片
    if (typeOptionsOriginalFiles && typeOptionsOriginalFiles.length > 0) {
      typeOptionsOriginalFiles.forEach(img => images.add(img));
      console.log(`FieldFile(${name}): 从typeOptions获取原始图片:`, typeOptionsOriginalFiles);
    }

    // 如果value是字符串且看起来像URL，也添加它
    if (typeof value === 'string' && (
      value.startsWith('http') ||
      value.startsWith('/') ||
      value.includes('.jpg') ||
      value.includes('.png') ||
      value.includes('/monkeys/')
    )) {
      images.add(value);
      console.log(`FieldFile(${name}): 从value获取原始图片:`, value);
    }

    // 如果value是数组，添加所有看起来像URL的字符串
    if (Array.isArray(value)) {
      const urlsFromValue: string[] = [];
      value.forEach(item => {
        if (typeof item === 'string' && (
          item.startsWith('http') ||
          item.startsWith('/') ||
          item.includes('.jpg') ||
          item.includes('.png') ||
          item.includes('/monkeys/')
        )) {
          images.add(item);
          urlsFromValue.push(item);
        }
      });
      if (urlsFromValue.length > 0) {
        console.log(`FieldFile(${name}): 从value数组获取原始图片:`, urlsFromValue);
      }
    }

    const result = Array.from(images);
    console.log(`FieldFile(${name}): 合并后的原始图片:`, result);
    return result;
  }, [name, originalInputImages, typeOptionsOriginalFiles, value]);

  const isMultiple = typeOptions?.multipleValues ?? false;

  const enableImageMask = typeOptions?.enableImageMask ?? false;

  // 调试信息
  React.useEffect(() => {
    console.log(`FieldFile(${name}): 合并后的原始图片:`, allOriginalImages);
  }, [name, allOriginalImages]);

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
              onChange={(urls) => form.setValue(name, isMultiple ? urls : urls[0])}
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
                onChange={(urls) => form.setValue(name, isMultiple ? urls : urls[0])}
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
