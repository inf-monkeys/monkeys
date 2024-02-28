import React, { useState } from 'react';

import { Dropzone, FileWithPath } from '@mantine/dropzone';
import { CheckCircle2, FileCheck, FileUp, XCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { Separator } from '@/components/ui/separator.tsx';
import { SmoothTransition } from '@/components/ui/smooth-transition-size/SmoothTransition.tsx';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { coverFileSize } from '@/components/ui/updater/utils.ts';

interface IUpdaterProps {
  files?: FileWithPath[]; // 文件列表
  limit?: number; // 文件数量限制
  maxSize?: number; // 文件大小限制 (MB)
  accept?: string[]; // 文件类型限制
}

export const Updater: React.FC<IUpdaterProps> = ({ files: initialFiles = [], accept, maxSize = 30, limit }) => {
  const [files, setFiles] = useState<FileWithPath[]>(initialFiles);
  const [isInteracted, setIsInteracted] = useState(false);

  const remaining = limit ? limit - files.length : 0;

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
          <div className="flex max-h-36 w-full">
            <ScrollArea className="grow pr-4">
              <Table>
                <TableCaption className="text-xs">
                  {remaining ? `可继续上传 ${remaining} 份文件` : '到底了~'}
                </TableCaption>
                <TableHeader>
                  <TableRow className="[&_th]:text-center">
                    <TableHead className="w-32 !text-left">文件名</TableHead>
                    <TableHead className="w-11">类型</TableHead>
                    <TableHead className="w-11">大小</TableHead>
                    <TableHead className="w-11">状态</TableHead>
                    <TableHead className="w-11">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {files.map(({ path, name, type, size }) => (
                    <Tooltip key={path}>
                      <TooltipTrigger asChild>
                        <TableRow className="[&_td]:text-xs">
                          <TableCell>
                            <p className="line-clamp-1 w-32 break-keep">{name}</p>
                          </TableCell>
                          <TableCell className="text-center">{type.split('/')?.[1] || type}</TableCell>
                          <TableCell className="text-center">{coverFileSize(size)}</TableCell>
                          <TableCell>
                            <CheckCircle2 size={16} className="m-auto" />
                          </TableCell>
                          <TableCell className="p-0 text-center">
                            <Button
                              className="scale-90 [&_svg]:stroke-black dark:[&_svg]:stroke-gold-12"
                              icon={<XCircle />}
                              variant="borderless"
                              onClick={() => setFiles((prev) => prev.filter((it) => it.path !== path))}
                            />
                          </TableCell>
                        </TableRow>
                      </TooltipTrigger>
                      <TooltipContent align="start">{name}</TooltipContent>
                    </Tooltip>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
            <div className="flex items-center pr-4">
              <Separator orientation="vertical" />
            </div>
            <div className="flex w-40 flex-none flex-col gap-2">
              <h1 className="font-bold">上传状态</h1>
              <div className="vines-center w-full flex-col gap-2 py-6">
                <FileCheck size={32} />
                <p className="text-xs">全部文件上传成功</p>
              </div>
            </div>
          </div>
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
