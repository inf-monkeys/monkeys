import React, { useState } from 'react';

import { useCreation } from 'ahooks';
import { motion } from 'framer-motion';
import { isString } from 'lodash';
import { CheckCircle2, FileCheck, FileClock, FileSearch, FileX2, Loader2, Trash, UploadCloud } from 'lucide-react';
import { FileWithPath } from 'react-dropzone';
import { useTranslation } from 'react-i18next';

import { ToolButton } from '@/components/layout/workspace/vines-view/flow/toolbar/tool-button.tsx';
import { AlertTitle } from '@/components/ui/alert.tsx';
import { Button } from '@/components/ui/button';
import { VinesImage, VinesImageGroup } from '@/components/ui/image';
import { Label } from '@/components/ui/label.tsx';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { Separator } from '@/components/ui/separator.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { IFile } from '@/components/ui/uploader/file-list.tsx';
import { useVinesUploaderManage } from '@/components/ui/uploader/use-vines-uploader-manage.ts';
import { coverFileSize } from '@/components/ui/uploader/utils.ts';
import { cn } from '@/utils';

interface IEmbedFileListProps extends React.ComponentPropsWithoutRef<'div'> {
  files: FileWithPath[];
  setFiles: React.Dispatch<React.SetStateAction<FileWithPath[]>>;
  onVisibleChange?: React.Dispatch<React.SetStateAction<boolean>>;

  isUploading: boolean;
  setIsUploading: React.Dispatch<React.SetStateAction<boolean>>;
  onFinished?: (urls: string[]) => void;

  saveToResource?: boolean;
  basePath?: string;

  limit?: number;
}

export const EmbedFileList: React.FC<IEmbedFileListProps> = ({
  files,
  setFiles,
  onVisibleChange,
  isUploading,
  setIsUploading,
  onFinished,

  saveToResource = true,
  basePath = 'user-files/other',

  limit,
}) => {
  const { t } = useTranslation();

  const [list, setList] = useState<IFile[]>([]);

  const { validList, hasFile, isWaitToUpload, handleOnClickUpload } = useVinesUploaderManage({
    files,
    list,
    setList,
    isUploading,
    setIsUploading,
    onFinished,
    saveToResource,
    basePath,
  });

  const preview = useCreation(
    () =>
      validList.map(({ id, path, file, size, name, status, progress, type }) => {
        const attr = {
          id,
          name,
          path,
          status,
          progress,
          size: coverFileSize(size),
        };

        if (isString(path) && /https?:\/\/[^\s"]+?\.(jpg|jpeg|png|gif|bmp|webp|svg)/gi.test(path)) {
          return { src: path, ...attr };
        }
        return { src: URL.createObjectURL(file), ...attr };
      }),
    [validList],
  );

  const remaining = limit ? limit - files.length : 0;

  const previewLength = preview.length;
  const needUpdateList = validList.filter((it) => !/(https|http):\/\/[^\s/]+\.[^\s/]+\/\S+\.\w{2,5}/g.test(it.path));

  const needUpdateListLength = needUpdateList.length;
  const isAllSuccess = needUpdateList.every((it) => it.status === 'success');

  return (
    <>
      <ScrollArea className="h-40 p-2" disabledOverflowMask>
        <VinesImageGroup
          preview={{
            onVisibleChange,
          }}
        >
          <motion.div
            key="vines-uploader-embed-file-list"
            className={cn(
              'grid grid-cols-1 items-center gap-2',
              previewLength > 1 ? (previewLength > 2 ? 'grid-cols-3' : 'grid-cols-2 ') : '',
            )}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            {preview.map(({ id, src, path, size, name, status, progress }) => (
              <Tooltip key={id}>
                <TooltipTrigger asChild>
                  <div className="group relative flex h-36 justify-center overflow-hidden rounded shadow hover:bg-gray-8">
                    <VinesImage src={src} className="h-full" />
                    <div className="absolute left-0 top-0 -ml-6 flex w-[calc(100%+3rem)] scale-75 items-center justify-between p-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <Label className="flex items-center gap-1 text-xs text-white [&>svg]:stroke-white">
                        {status === 'wait' && <FileSearch size={16} />}
                        {status === 'busy' ? `${progress}% ` : ''}
                        {status === 'uploading' && <Loader2 size={16} className="animate-spin" />}
                        {status === 'wait-to-update' && <FileClock size={16} />}
                        {status === 'success' && <CheckCircle2 size={16} />}
                        {status === 'error' && <FileX2 size={16} />}
                        {t(`components.ui.updater.file-list.item-status.${status}`)}
                      </Label>
                      <Label className="text-xs text-white">{size}</Label>
                    </div>
                    <div
                      className="absolute bottom-1 left-1/2 flex -translate-x-1/2 scale-75 transform flex-nowrap gap-1 rounded-md border bg-card p-1 opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
                      onClick={(e) => e.preventDefault()}
                    >
                      <ToolButton
                        icon={<Trash />}
                        tip={t('components.ui.updater.remove')}
                        side="top"
                        onClick={() => {
                          setFiles((prev) => prev.filter((it) => it.path !== path));
                          setList((prev) => prev.filter((it) => it.id !== id));
                        }}
                      />
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>{name}</TooltipContent>
              </Tooltip>
            ))}
          </motion.div>
        </VinesImageGroup>
      </ScrollArea>
      <motion.div
        key="vines-uploader-embed-toolbar"
        className="w-full overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { delay: 0.2 } }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <div
          className={cn(
            'relative m-1 -mt-11 flex w-[calc(100%-0.5rem)] items-center gap-2 rounded-lg border bg-background px-4 py-3 text-foreground opacity-0 transition-all group-hover/up:-mt-0 group-hover/up:opacity-100 [&>svg]:text-foreground',
            (needUpdateListLength > 0 || isUploading) && '!-mt-0 !opacity-100',
          )}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          {!hasFile ? (
            <>
              <FileClock className="size-4" size={16} />
              <AlertTitle className="mb-0 text-xs">
                {t('components.ui.updater.file-list.status.waiting-for-file', { count: limit ?? 2 })}
              </AlertTitle>
            </>
          ) : isAllSuccess ? (
            <>
              <FileCheck className="size-4" size={16} />
              <AlertTitle className="mb-0 text-xs">
                {t('components.ui.updater.file-list.status.upload-successful')}
              </AlertTitle>
            </>
          ) : isWaitToUpload && !isUploading ? (
            <>
              <UploadCloud className="size-4" size={16} />
              <AlertTitle className="mb-0 text-xs">
                {t('components.ui.updater.file-list.status.waiting-for-uploading')}
              </AlertTitle>
            </>
          ) : (
            <>
              <Loader2 size={16} className="size-4 animate-spin" />
              <AlertTitle className="mb-0 text-xs">
                {t('components.ui.updater.file-list.status.status.hint', {
                  operate:
                    validList.some((it) => it.status === 'uploading') || isUploading
                      ? t('components.ui.updater.file-list.status.status.upload')
                      : t('components.ui.updater.file-list.status.status.calculate'),
                  count: limit ?? 2,
                })}
              </AlertTitle>
            </>
          )}
          {needUpdateListLength > 0 && (
            <>
              <Separator orientation="vertical" className="h-4" />
              <Label className="text-xs">
                {t('components.ui.updater.file-list.status.count', { count: needUpdateListLength })}
              </Label>
              <div className="-my-2 -mr-8 flex flex-1 scale-90 justify-end">
                {isWaitToUpload && !isUploading && (
                  <Button variant="outline" size="small" onClick={handleOnClickUpload}>
                    {t('components.ui.updater.file-list.status.status.upload')}
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </motion.div>
      <div className="absolute bottom-1 right-2 opacity-0 transition-opacity group-hover/up:opacity-100">
        <Label className="text-xs font-normal text-input">
          {remaining
            ? t('components.ui.updater.file-list.info-table.caption.remaining', {
                remaining,
                count: remaining,
              })
            : ''}
        </Label>
      </div>
    </>
  );
};
