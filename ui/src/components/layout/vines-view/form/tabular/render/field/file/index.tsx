import React, { useCallback, useEffect, useState } from 'react';

import { isArray, isString, set } from 'lodash';
import { FileWithPath } from 'react-dropzone';
import { UseFormReturn } from 'react-hook-form';

import { FieldImageMaskEditor } from '@/components/layout/vines-view/form/tabular/render/field/file/field-image-mask-editor.tsx';
import { Card, CardContent } from '@/components/ui/card.tsx';
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

  const [width, setWidth] = useState<number>();
  const [height, setHeight] = useState<number>();
  const containerRef = useCallback((node: HTMLDivElement) => {
    if (node) {
      setWidth(node.getBoundingClientRect().width - 40);
      setHeight(node.getBoundingClientRect().height - 116);
    }
  }, []);

  return (
    type === 'file' && (
      <Card className="w-full overflow-hidden max-sm:max-w-[calc(100vw-3rem)]" ref={containerRef}>
        <CardContent className="relative p-4">
          {typeOptions?.enableImageMask ? (
            <FieldImageMaskEditor
              form={form}
              name={name}
              value={value}
              isMultiple={isMultiple}
              maxHeight={height}
              maxWidth={width}
            />
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
