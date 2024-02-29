import React, { useState } from 'react';

import { Dropzone, FileWithPath } from '@mantine/dropzone';
import { FileUp } from 'lucide-react';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { SmoothTransition } from '@/components/ui/smooth-transition-size/SmoothTransition.tsx';
import { FileList } from '@/components/ui/updater/file-list.tsx';

interface IUpdaterProps {
  files?: FileWithPath[]; // 文件列表
  limit?: number; // 文件数量限制
  maxSize?: number; // 文件大小限制 (MB)
  accept?: string[]; // 文件类型限制
}

export const Updater: React.FC<IUpdaterProps> = ({ files: initialFiles = [], accept, maxSize = 30, limit }) => {
  const [files, setFiles] = useState<FileWithPath[]>(initialFiles);

  const [isInteracted, setIsInteracted] = useState(false);

  return (
    <div className="flex w-full flex-col gap-4">
      <Dropzone
        onDrop={(_files) => {
          setFiles(_files);
          !isInteracted && setIsInteracted(true);
        }}
        accept={accept}
        maxSize={maxSize * 1024 ** 2}
        maxFiles={limit}
      >
        <div className="vines-center h-40 gap-4">
          <FileUp size={50} className="stroke-gold-12" />
          <div className="flex max-w-[70%] flex-col">
            <h1 className="text-lg font-bold leading-tight">点击上传文件或拖拽任意文件到这里</h1>
            <p className="text-xs text-opacity-85">
              {accept
                ? `仅支持 ${accept.map((it) => `.${it?.split('/')?.[1] ?? it}`).join('、')} 格式的文件`
                : '支持上传任意格式的文件'}
              ，不超过 {maxSize}MB
            </p>
          </div>
        </div>
      </Dropzone>

      {isInteracted && (
        <SmoothTransition className="overflow-hidden">
          <FileList files={files} setFiles={setFiles} limit={limit} />
        </SmoothTransition>
      )}
    </div>
  );
};

export const VinesUpdater: React.FC<
  IUpdaterProps & {
    children: React.ReactNode;
  }
> = ({ children, ...props }) => (
  <Dialog>
    <DialogTrigger asChild>{children}</DialogTrigger>
    <DialogContent className="sm:max-w-[625px]">
      <DialogHeader>
        <DialogTitle>上传文件</DialogTitle>
      </DialogHeader>
      <Updater {...props} />
    </DialogContent>
  </Dialog>
);
