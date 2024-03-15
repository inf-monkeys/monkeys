import React, { useEffect, useRef, useState } from 'react';

import { FileWithPath } from '@mantine/dropzone';
import { set } from 'lodash';
import { CheckCircle2, FileCheck, FileClock, FileSearch, FileX2, Loader2, UploadCloud, XCircle } from 'lucide-react';
import { toast } from 'sonner';

import { createResource, getResourceByMd5 } from '@/apis/resources';
import { VinesResourceImageParams, VinesResourceSource, VinesResourceType } from '@/apis/resources/typting.ts';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress.tsx';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { Separator } from '@/components/ui/separator.tsx';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  calculateMD5,
  coverFileSize,
  escapeFileName,
  generateUploadFilePrefix,
  getImageSize,
  uploadFile,
} from '@/components/ui/updater/utils.ts';
import { cn } from '@/utils';

interface IFilesProps extends React.ComponentPropsWithoutRef<'div'> {
  files: FileWithPath[];
  setFiles: React.Dispatch<React.SetStateAction<FileWithPath[]>>;
  isUploading: boolean;
  setIsUploading: React.Dispatch<React.SetStateAction<boolean>>;
  saveToResource?: boolean;
  onFinished?: (urls: string[]) => void;
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
  url?: string;
  status: 'wait' | 'busy' | 'wait-to-update' | 'uploading' | 'error' | 'success';
  progress: string;
}

export const FileList: React.FC<IFilesProps> = ({
  files,
  setFiles,
  limit,
  isUploading,
  setIsUploading,
  onFinished,
  saveToResource = true,
}) => {
  const [list, setList] = useState<IFile[]>([]);
  const [hiddenList, setHiddenList] = useState<string[]>([]);

  const fileMd5 = useRef(new Map<string, string>());
  const [md5Queue, setMd5Queue] = useState<string[]>([]);

  useEffect(() => {
    const newList: IFile[] = files
      .map((it) => {
        const path = it.path;
        if (!path || list.some((item) => item.path === path)) return null;
        const fileId = generateUploadFilePrefix();
        !fileMd5.current.has(path) && setMd5Queue((prev) => [...prev, fileId]);
        return {
          id: fileId,
          file: it,
          path: path,
          name: it.name,
          type: it.type,
          size: it.size,
          status: 'wait',
          progress: '0',
        };
      })
      .filter((it) => it !== null) as IFile[];
    setList((prev) => [...prev, ...newList]);
    setHiddenList(list.filter((it) => !files.some((file) => file.path === it.path)).map((it) => it.id));
  }, [files]);

  const updateListById = (id: string, data: Partial<IFile>) => {
    setList((prev) => prev.map((it) => (it.id === id ? { ...it, ...data } : it)));
  };

  const isBusyRef = useRef(false);
  const handleCalcMd5 = async () => {
    const fileId = md5Queue[0];
    const it = list.find((it) => it.id === fileId);

    if (!fileId || !it || isBusyRef.current) return;
    isBusyRef.current = true;

    it.status = 'busy';
    const md5 = (await calculateMD5(it.file, (process) => {
      it.progress = process.toFixed(2);
      updateListById(fileId, it);
    })) as string;
    if (!md5) {
      it.status = 'error';
      updateListById(fileId, it);
      isBusyRef.current = false;
      return;
    }
    set(it, 'md5', md5);
    it.status = 'wait-to-update';
    updateListById(fileId, it);
    fileMd5.current.set(it.path, md5);

    isBusyRef.current = false;
    setMd5Queue((prev) => prev.filter((it) => it !== fileId));
  };

  useEffect(() => {
    void handleCalcMd5();
  }, [md5Queue]);

  const finalLists = list.filter((it) => !hiddenList.includes(it.id));
  const hasFile = finalLists.length > 0;
  const isWaitToUpload = hasFile && finalLists.every((it) => it.status === 'wait-to-update');

  const [uploadQueue, setUploadQueue] = useState<string[]>([]);
  const handleOnClickUpload = async () => {
    if (!isWaitToUpload) return;
    const filteredList = finalLists.filter((it) => !/(https|http):\/\/[^\s/]+\.[^\s/]+\/\S+\.\w{2,5}/g.test(it.path));
    if (!filteredList.length) {
      toast.error('没有需要上传的文件');
      return;
    }
    setIsUploading(true);
    setUploadQueue(filteredList.map((it) => it.id));
    setList((prev) => prev.map((it) => ({ ...it, progress: '0' })));
  };

  const node = useRef<HTMLDivElement>(null);
  const isUploadBusyRef = useRef(false);
  const handleUpload = async () => {
    const fileId = uploadQueue[0];
    const it = list.find((it) => it.id === fileId);

    if (!fileId || !it) return;
    isUploadBusyRef.current = true;
    it.status = 'uploading';
    updateListById(fileId, it);

    const existingFileUrl = (await getResourceByMd5(it.md5 as string))?.url;
    let ossUrl: string = '';
    if (existingFileUrl) {
      ossUrl = existingFileUrl;
      it.progress = '100';
    }

    if (!ossUrl) {
      const file = it.file;
      const fileNameArray = file.name.split('.');
      const fileNameWithoutSuffix = fileNameArray.length > 1 ? fileNameArray.slice(0, -1).join('.') : fileNameArray[0];
      const suffix = fileNameArray.length > 1 ? fileNameArray.pop() : null;
      const filename = `workflow/${it.id}_${escapeFileName(fileNameWithoutSuffix)}${suffix ? '.'.concat(suffix) : ''}`;

      it.status = 'busy';
      updateListById(fileId, it);
      ossUrl = await uploadFile(file, filename, (progress) => {
        it.progress = progress.toFixed(2);
        updateListById(fileId, it);
      });

      if (saveToResource) {
        let params: VinesResourceImageParams | undefined = void 0;
        if (file.type.startsWith('image')) {
          params = await getImageSize(ossUrl);
        }
        await createResource({
          type: file.type as VinesResourceType,
          md5: it.md5,
          name: file.name,
          source: VinesResourceSource.UPLOAD,
          url: ossUrl,
          tags: [],
          categoryIds: [],
          size: file.size,
          params,
        });
      }
    }

    it.url = ossUrl;
    it.status = 'success';
    updateListById(fileId, it);
    isUploadBusyRef.current = false;
    setUploadQueue((prev) => prev.filter((it) => it !== fileId));
  };

  useEffect(() => {
    if (isUploadBusyRef.current) return;
    if (uploadQueue.length) {
      void handleUpload();
    } else if (isUploading) {
      setTimeout(() => onFinished?.(finalLists.map((it) => it?.url ?? '').filter((it) => it)), 1000);
      setIsUploading(false);
    }
  }, [uploadQueue]);

  const remaining = limit ? limit - files.length : 0;

  const totalProgress = finalLists.reduce((prev, curr) => prev + Number(curr.progress), 0) / finalLists.length;

  return (
    <>
      <div className="flex max-h-36 w-full">
        <ScrollArea className="grow pr-4" ref={node}>
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
              {finalLists.map(({ id, path, name, type, size, status, md5, progress }) => (
                <Tooltip key={path}>
                  <TooltipTrigger asChild>
                    <TableRow className="[&_td]:text-xs" id={'vines-uploader-' + id}>
                      <TableCell>
                        <p className="line-clamp-1 w-32 break-keep">{name}</p>
                      </TableCell>
                      <TableCell className="text-center">{type.split('/')?.[1] || type}</TableCell>
                      <TableCell className="text-center">{coverFileSize(size)}</TableCell>
                      <TableCell className="[&_svg]:m-auto">
                        {status === 'wait' && <FileSearch size={16} />}
                        {status === 'busy' ? `${progress}%` : ''}
                        {status === 'uploading' && <Loader2 size={16} className="animate-spin" />}
                        {status === 'wait-to-update' && <FileClock size={16} />}
                        {status === 'success' && <CheckCircle2 size={16} />}
                        {status === 'error' && <FileX2 size={16} />}
                      </TableCell>
                      <TableCell className="p-0 text-center">
                        <Button
                          disabled={status === 'uploading' || status === 'busy' || isUploading}
                          className="scale-90 [&_svg]:stroke-black dark:[&_svg]:stroke-gold-12"
                          icon={<XCircle />}
                          variant="borderless"
                          onClick={() => setFiles((prev) => prev.filter((it) => it.path !== path))}
                        />
                      </TableCell>
                    </TableRow>
                  </TooltipTrigger>
                  <tr>
                    <td>
                      <TooltipContent align="start">
                        文件名：{name}
                        <br />
                        MD5: {!progress ? '正在等待计算中' : md5 ?? `正在计算中（${progress}%）`}
                      </TooltipContent>
                    </td>
                  </tr>
                </Tooltip>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
        <div className="flex items-center pr-4">
          <Separator orientation="vertical" />
        </div>
        <div
          className={cn(
            'vines-center w-40 flex-none select-none flex-col gap-2 rounded py-6 transition-colors',
            isWaitToUpload && !isUploading && 'cursor-pointer hover:bg-black hover:bg-opacity-5 active:bg-opacity-10',
          )}
          onClick={handleOnClickUpload}
        >
          {!hasFile ? (
            <>
              <FileClock size={32} />
              <p className="text-xs">等待文件中</p>
            </>
          ) : finalLists
              .filter((it) => !/(https|http):\/\/[^\s/]+\.[^\s/]+\/\S+\.\w{2,5}/g.test(it.path))
              .every((it) => it.status === 'success') ? (
            <>
              <FileCheck size={32} />
              <p className="text-xs">上传成功</p>
            </>
          ) : isWaitToUpload && !isUploading ? (
            <>
              <UploadCloud size={32} />
              <p className="text-xs">等待操作上传</p>
              <p className="text-xxs -mt-1.5 opacity-50">（点此上传）</p>
            </>
          ) : (
            <>
              <Loader2 size={32} className="animate-spin" />
              <p className="text-xs">
                正在{finalLists.some((it) => it.status === 'uploading') || isUploading ? '上传' : '计算'}文件
              </p>
            </>
          )}
        </div>
      </div>
      {isUploading && (
        <div className="w-full pt-4">
          <Progress value={totalProgress} className="w-full" />
        </div>
      )}
    </>
  );
};
