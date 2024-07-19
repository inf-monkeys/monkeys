import React, { useEffect, useState } from 'react';

import { isArray, isString, set } from 'lodash';
import { FileWithPath } from 'react-dropzone';
import { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card.tsx';
import { VinesImageMaskEditor } from '@/components/ui/image-mask-editor';
import { Updater } from '@/components/ui/updater';
import { getFileNameByOssUrl } from '@/components/ui/updater/utils.ts';
import { VinesWorkflowVariable } from '@/package/vines-flow/core/tools/typings.ts';
import { IWorkflowInputForm } from '@/schema/workspace/workflow-input-form.ts';

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

  return (
    type === 'file' &&
    (typeOptions?.enableImageMask ? (
      <div className="flex items-center justify-between">
        <span className="text-xs text-opacity-70">{t('workspace.pre-view.actuator.execution-form.file.label')}</span>
        <VinesImageMaskEditor
          onFinished={(urls) => {
            console.log('form-set', isMultiple ? urls : urls[0]);
            form.setValue(name, isMultiple ? urls : urls[0]);
          }}
        >
          <Button variant="outline" size="small" className="-mr-1 scale-90">
            {t('workspace.pre-view.actuator.execution-form.file.click-to-open-in-image-mask-editor-and-upload')}
          </Button>
        </VinesImageMaskEditor>
      </div>
    ) : (
      <Card className="w-full">
        <CardContent className="p-4">
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
        </CardContent>
      </Card>
    ))
  );
};
