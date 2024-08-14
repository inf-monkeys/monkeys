import React, { useState } from 'react';

import { CheckCircle2, FileCheck, FileClock, FileSearch, FileX2, Loader2, UploadCloud, XCircle } from 'lucide-react';
import { FileWithPath } from 'react-dropzone';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress.tsx';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { Separator } from '@/components/ui/separator.tsx';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useVinesUploaderManage } from '@/components/ui/uploader/use-vines-uploader-manage.ts';
import { coverFileSize } from '@/components/ui/uploader/utils.ts';
import { cn } from '@/utils';

interface IFilesProps extends React.ComponentPropsWithoutRef<'div'> {
  files: FileWithPath[];
  setFiles: React.Dispatch<React.SetStateAction<FileWithPath[]>>;
  isUploading: boolean;
  setIsUploading: React.Dispatch<React.SetStateAction<boolean>>;
  saveToResource?: boolean;
  onFinished?: (urls: string[]) => void;
  limit?: number;
  basePath?: string;
}

export interface IFile {
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
  basePath = 'user-files/other',
}) => {
  const { t } = useTranslation();

  const [list, setList] = useState<IFile[]>([]);

  const { validList, hasFile, isWaitToUpload, handleOnClickUpload } = useVinesUploaderManage({
    files,
    list,
    setList,
    setIsUploading,
    isUploading,
    saveToResource,
    basePath,
    onFinished,
  });

  const remaining = limit ? limit - files.length : 0;

  const totalProgress = validList.reduce((prev, curr) => prev + Number(curr.progress), 0) / validList.length;

  return (
    <>
      <div className="flex max-h-36 w-full">
        <ScrollArea className="grow pr-4">
          <Table>
            <TableCaption className="text-xs">
              {remaining
                ? t('components.ui.updater.file-list.info-table.caption.remaining', {
                    remaining,
                    count: remaining,
                  })
                : t('components.ui.updater.file-list.info-table.caption.none')}
            </TableCaption>
            <TableHeader>
              <TableRow className="[&_th]:text-center">
                <TableHead className="w-11">
                  {t('components.ui.updater.file-list.info-table.columns.operate')}
                </TableHead>
                <TableHead className="w-32 !text-left">
                  {t('components.ui.updater.file-list.info-table.columns.name')}
                </TableHead>
                <TableHead className="w-11">{t('components.ui.updater.file-list.info-table.columns.type')}</TableHead>
                <TableHead className="w-11">{t('components.ui.updater.file-list.info-table.columns.size')}</TableHead>
                <TableHead className="w-11">{t('components.ui.updater.file-list.info-table.columns.status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {validList.map(({ id, path, name, type, size, status, md5, progress }) => (
                <Tooltip key={id}>
                  <TooltipTrigger asChild>
                    <TableRow className="[&_td]:text-xs" id={'vines-uploader-' + id}>
                      <TableCell className="p-0 text-center">
                        <Button
                          disabled={status === 'uploading' || status === 'busy' || isUploading}
                          className="scale-90 [&_svg]:stroke-black dark:[&_svg]:stroke-gold-12"
                          icon={<XCircle />}
                          variant="borderless"
                          type="button"
                          onClick={() => {
                            setFiles((prev) => prev.filter((it) => it.path !== path));
                            setList((prev) => prev.filter((it) => it.id !== id));
                          }}
                        />
                      </TableCell>
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
                    </TableRow>
                  </TooltipTrigger>
                  <tr>
                    <td>
                      <TooltipContent align="start">
                        {t('components.ui.updater.file-list.info-tooltip.name') + name}
                        <br />
                        {t('components.ui.updater.file-list.info-tooltip.md5.index') +
                          (!progress
                            ? t('components.ui.updater.file-list.info-tooltip.md5.waiting')
                            : md5 ?? t('components.ui.updater.file-list.info-tooltip.md5.in-progress', { progress }))}
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
              <p className="text-xs">
                {t('components.ui.updater.file-list.status.waiting-for-file', { count: limit ?? 2 })}
              </p>
            </>
          ) : validList
              .filter((it) => !/(https|http):\/\/[^\s/]+\.[^\s/]+\/\S+\.\w{2,5}/g.test(it.path))
              .every((it) => it.status === 'success') ? (
            <>
              <FileCheck size={32} />
              <p className="text-xs">{t('components.ui.updater.file-list.status.upload-successful')}</p>
            </>
          ) : isWaitToUpload && !isUploading ? (
            <>
              <UploadCloud size={32} />
              <p className="text-xs">{t('components.ui.updater.file-list.status.waiting-for-uploading')}</p>
              <p className="text-xxs -mt-1.5 opacity-50">
                {t('components.ui.updater.file-list.status.waiting-for-uploading-description')}
              </p>
            </>
          ) : (
            <>
              <Loader2 size={32} className="animate-spin" />
              <p className="text-xs">
                {t('components.ui.updater.file-list.status.status.hint', {
                  operate:
                    validList.some((it) => it.status === 'uploading') || isUploading
                      ? t('components.ui.updater.file-list.status.status.upload')
                      : t('components.ui.updater.file-list.status.status.calculate'),
                  count: limit ?? 2,
                })}
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
