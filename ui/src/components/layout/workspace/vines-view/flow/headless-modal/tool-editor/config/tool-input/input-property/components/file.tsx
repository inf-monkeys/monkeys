import React, { useEffect, useState } from 'react';

import { get, isArray, isString, set } from 'lodash';
import { FileWithPath } from 'react-dropzone';
import { Uploader } from 'src/components/ui/uploader';

import { IVinesInputPropertyProps } from '@/components/layout/workspace/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property';
import { Card, CardContent } from '@/components/ui/card.tsx';
import { getFileNameByOssUrl } from '@/components/ui/uploader/utils.ts';

export const FileInput: React.FC<IVinesInputPropertyProps> = ({ def, value, onChange }) => {
  const accept = get(def, 'typeOptions.accept', '');
  const multipleValues = get(def, 'typeOptions.multipleValues', isArray(value));
  const maxSize = get(def, 'typeOptions.maxSize', void 0);

  const finalAccept = accept.split(',').map((it: string) => it.replace('.', ''));
  const finalMaxSize = maxSize ? maxSize / 1024 / 1024 : void 0;

  const [files, setFiles] = useState<FileWithPath[]>([]);

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
    <Card>
      <CardContent className="p-2">
        <Uploader
          files={files}
          onFilesUpdate={(_files) => {
            const updateFilesLength = _files.length;
            if (!updateFilesLength) return;
            if (updateFilesLength < files.length) {
              if (multipleValues) {
                onChange(_files.map((it) => it.path));
              } else {
                onChange(_files.map((it) => it.path)[0]);
              }
            }
          }}
          accept={finalAccept}
          maxSize={finalMaxSize}
          limit={multipleValues ? void 0 : 1}
          onFinished={(urls) =>
            onChange(
              multipleValues ? [...files.map((it) => it.path), ...urls] : [...files.map((it) => it.path), ...urls][0],
            )
          }
          basePath="user-files/workflow-input"
          mode="embed"
        />
      </CardContent>
    </Card>
  );
};
