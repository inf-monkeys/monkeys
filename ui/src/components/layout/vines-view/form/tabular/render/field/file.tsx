import React, { useCallback, useEffect, useState } from 'react';

import { useEventEmitter } from 'ahooks';
import { motion } from 'framer-motion';
import { isArray, isString, set } from 'lodash';
import { FileWithPath } from 'react-dropzone';
import { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card.tsx';
import { IImageMaskEditorEvent, ImageMaskEditor } from '@/components/ui/image-mask-editor';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { Updater } from '@/components/ui/updater';
import { getFileNameByOssUrl } from '@/components/ui/updater/utils.ts';
import { VinesWorkflowVariable } from '@/package/vines-flow/core/tools/typings.ts';
import { IWorkflowInputForm } from '@/schema/workspace/workflow-input-form.ts';
import { cn } from '@/utils';

interface IFieldFileProps {
  input: VinesWorkflowVariable;
  form: UseFormReturn<IWorkflowInputForm>;
  value: any;
}

export const FieldFile: React.FC<IFieldFileProps> = ({ value, input: { name, type, typeOptions }, form }) => {
  const { t } = useTranslation();

  const [files, setFiles] = useState<FileWithPath[]>([]);

  const isMultiple = typeOptions?.multipleValues ?? false;

  useEffect(() => {
    if (value === '' || !value) return;

    const newFiles: FileWithPath[] = [];
    if (isArray(value)) {
      for (const url of value
        .map((it) => it.toString())
        .filter((it) => /(https|http):\/\/[^\s/]+\.[^\s/]+\/\S+\.\w{2,5}/g.test(it))) {
        const fileName = getFileNameByOssUrl(url);
        const file: FileWithPath = new File([url], fileName, {
          type: fileName.split('.').pop() ?? 'file',
        });
        set(file, 'path', url);
        newFiles.push(file);
      }
    } else if (isString(value) && /(https|http):\/\/[^\s/]+\.[^\s/]+\/\S+\.\w{2,5}/g.test(value)) {
      const fileName = getFileNameByOssUrl(value);
      const file: FileWithPath = new File([value], fileName, {
        type: fileName.split('.').pop() ?? 'file',
      });
      set(file, 'path', value);
      newFiles.push(file);
    }
    setFiles(newFiles);
  }, [value]);

  const [maskEditorVisible, setMaskEditorVisible] = useState(false);
  const [maskEditorLoading, setMaskEditorLoading] = useState(false);
  const maskEditor$ = useEventEmitter<IImageMaskEditorEvent>();

  const [width, setWidth] = useState<number>();
  const [height, setHeight] = useState<number>();
  const containerRef = useCallback((node: HTMLDivElement) => {
    if (node) {
      setWidth(node.getBoundingClientRect().width - 40);
      setHeight(node.getBoundingClientRect().height);
    }
  }, []);

  return (
    type === 'file' && (
      <Card className="w-full overflow-hidden max-sm:max-w-[calc(100vw-3rem)]" ref={containerRef}>
        <CardContent className="relative p-4">
          {typeOptions?.enableImageMask ? (
            <>
              <ImageMaskEditor
                className="h-64 w-full max-w-full"
                style={{ maxWidth: width }}
                event$={maskEditor$}
                onBeforeSave={() => setMaskEditorLoading(false)}
                onBeforeExport={() => setMaskEditorLoading(true)}
                onFinished={(urls) => {
                  console.log('form-set', isMultiple ? urls : urls[0]);
                  form.setValue(name, isMultiple ? urls : urls[0]);
                  setMaskEditorVisible(false);
                }}
                tipsEnabled={false}
                enableMini
              />
              <div className="mt-2 flex w-full justify-between">
                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    maskEditor$.emit('trigger-reselect-file');
                  }}
                >
                  {t('components.ui.vines-image-mask-editor.operate.select-image')}
                </Button>
                <div className="space-x-2">
                  <Button
                    variant="outline"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setMaskEditorVisible(false);
                    }}
                  >
                    {t('common.utils.cancel')}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      maskEditor$.emit('trigger-save');
                    }}
                    loading={maskEditorLoading}
                  >
                    {t('common.utils.save')}
                  </Button>
                </div>
              </div>
              <motion.div
                className={cn(
                  'vines-center absolute left-0 top-0 z-10 size-full flex-col gap-4 overflow-hidden rounded-md bg-background p-4',
                  maskEditorVisible && 'pointer-events-none z-0',
                )}
                initial={{ opacity: 0 }}
                animate={{ opacity: maskEditorVisible ? 0 : 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div
                  className={cn(
                    'size-full overflow-hidden rounded-md border border-input',
                    !value && 'vines-center flex-col gap-4 p-2',
                  )}
                >
                  {value ? (
                    <ScrollArea style={{ height }}>
                      <img
                        src={value}
                        alt="mask"
                        className="aspect-square w-full transform rounded-lg object-cover object-center shadow transition-transform duration-200 ease-in-out"
                      />
                    </ScrollArea>
                  ) : (
                    <>
                      <span className="text-sm text-gray-10">
                        {t('workspace.pre-view.actuator.execution-form.mask-editor.empty')}
                      </span>
                      <Button
                        variant="outline"
                        size="small"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setMaskEditorVisible(true);
                          maskEditor$.emit('trigger-reselect-file');
                        }}
                      >
                        {t('workspace.pre-view.actuator.execution-form.mask-editor.empty-action')}
                      </Button>
                    </>
                  )}
                </div>
                {value && (
                  <div className="space-x-4">
                    <Button
                      variant="outline"
                      size="small"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setMaskEditorVisible(true);
                        maskEditor$.emit('trigger-reselect-file');
                      }}
                    >
                      {t('workspace.pre-view.actuator.execution-form.mask-editor.re-edit')}
                    </Button>
                    <Button
                      variant="outline"
                      size="small"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        form.setValue(name, void 0);
                      }}
                    >
                      {t('workspace.pre-view.actuator.execution-form.mask-editor.clear')}
                    </Button>
                  </div>
                )}
              </motion.div>
            </>
          ) : (
            <Updater
              files={files}
              onFilesUpdate={(_files) => {
                const updateFilesLength = _files.length;
                if (!updateFilesLength) {
                  form.setValue(name, void 0);
                  return;
                }
                if (updateFilesLength < files.length) {
                  if (isMultiple) {
                    form.setValue(name, _files.map((it) => it.path) as string[]);
                  } else {
                    form.setValue(name, _files.map((it) => it.path)[0]);
                  }
                }
              }}
              limit={isMultiple ? void 0 : 1}
              onFinished={(urls) => {
                form.setValue(name, isMultiple ? urls : urls[0]);
              }}
              basePath="user-files/workflow-input"
            />
          )}
        </CardContent>
      </Card>
    )
  );
};
