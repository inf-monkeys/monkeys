import React, { useEffect, useRef, useState } from 'react';

import { FileWithPath } from '@mantine/dropzone';
import { set } from 'lodash';
import { CheckCircle2, FileCheck, FileClock, FileX2, Loader2, XCircle } from 'lucide-react';
import { nanoid } from 'nanoid';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { Separator } from '@/components/ui/separator.tsx';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { calculateMD5, coverFileSize } from '@/components/ui/updater/utils.ts';

interface IFilesProps extends React.ComponentPropsWithoutRef<'div'> {
  files: FileWithPath[];
  setFiles: React.Dispatch<React.SetStateAction<FileWithPath[]>>;
  limit?: number;
}

interface IFile {
  id: string;
  file: FileWithPath;
  path: string;
  name: string;
  type: string;
  size: number;
  md5?: string;
  status: 'wait' | 'busy' | 'uploading' | 'error' | 'success';
  progress: number;
}

export const FileList: React.FC<IFilesProps> = ({ files, setFiles, limit }) => {
  const [list, setList] = useState<IFile[]>([]);
  const [hiddenList, setHiddenList] = useState<string[]>([]);

  useEffect(() => {
    const newList: IFile[] = files
      .map((it) => {
        const path = it.path;
        if (!path || list.some((item) => item.path === path)) return null;
        return {
          id: nanoid(10),
          file: it,
          path: path,
          name: it.name,
          type: it.type,
          size: it.size,
          status: 'wait',
          progress: 0,
        };
      })
      .filter((it) => it !== null) as IFile[];
    setList((prev) => [...prev, ...newList]);
    setHiddenList(list.filter((it) => !files.some((file) => file.path === it.path)).map((it) => it.id));
  }, [files]);

  const fileMd5 = useRef(new Map<string, string>());
  useEffect(() => {
    list
      .filter((it) => it.status === 'wait')
      .forEach((it) => {
        it.status = 'busy';
        setList((prev) => prev.map((item) => (item.id === it.id ? it : item)));
        calculateMD5(it.file, (process) => {
          it.progress = process;
          setList((prev) => prev.map((item) => (item.id === it.id ? it : item)));
        }).then((md5) => {
          if (!md5) {
            it.status = 'error';
            setList((prev) => prev.map((item) => (item.id === it.id ? it : item)));
            return;
          }
          set(it, 'md5', md5);
          it.status = 'success';
          setList((prev) => prev.map((item) => (item.id === it.id ? it : item)));
          fileMd5.current.set(it.path, typeof md5 === 'string' ? md5 : '');
        });
      });
  }, [list]);

  const finalLists = list.filter((it) => !hiddenList.includes(it.id));
  const remaining = limit ? limit - files.length : 0;

  return (
    <div className="flex max-h-36 w-full">
      <ScrollArea className="grow pr-4">
        <Table>
          <TableCaption className="text-xs">{remaining ? `可继续上传 ${remaining} 份文件` : '到底了~'}</TableCaption>
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
            {finalLists.map(({ path, name, type, size, status, md5, progress }) => (
              <Tooltip key={path}>
                <TooltipTrigger asChild>
                  <TableRow className="[&_td]:text-xs">
                    <TableCell>
                      <p className="line-clamp-1 w-32 break-keep">{name}</p>
                    </TableCell>
                    <TableCell className="text-center">{type.split('/')?.[1] || type}</TableCell>
                    <TableCell className="text-center">{coverFileSize(size)}</TableCell>
                    <TableCell className="[&_svg]:m-auto">
                      {status === 'wait' && <FileClock size={16} />}
                      {status === 'busy' && <Loader2 size={16} className="animate-spin" />}
                      {status === 'success' && <CheckCircle2 size={16} />}
                      {status === 'error' && <FileX2 size={16} />}
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
                <TooltipContent align="start">
                  文件名：{name}
                  <br />
                  MD5: {!progress ? '正在等待计算中' : md5 ?? `正在计算中（${progress}%）`}
                </TooltipContent>
              </Tooltip>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
      <div className="flex items-center pr-4">
        <Separator orientation="vertical" />
      </div>
      <div className="vines-center w-40 flex-none flex-col gap-2 py-6">
        {!finalLists.length ? (
          <>
            <FileClock size={32} />
            <p className="text-xs">等待文件中</p>
          </>
        ) : finalLists.every((it) => it.status === 'success') ? (
          <>
            <FileCheck size={32} />
            <p className="text-xs">上传成功</p>
          </>
        ) : (
          <>
            <Loader2 size={32} className="animate-spin" />
            <p className="text-xs">正在{finalLists.some((it) => it.status === 'uploading') ? '上传' : '处理'}文件</p>
          </>
        )}
      </div>
    </div>
  );
};
