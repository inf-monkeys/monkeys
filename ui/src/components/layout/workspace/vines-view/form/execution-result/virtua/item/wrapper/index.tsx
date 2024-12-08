import React from 'react';

import { useMemoizedFn } from 'ahooks';
import FileSaver from 'file-saver';
import { fileTypeFromBlob } from 'file-type';
import { Download, Ellipsis } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { IVinesExecutionResultItem } from '@/components/layout/workspace/vines-view/form/execution-result/virtua/item';
import { VirtuaExecutionResultRawDataDialog } from '@/components/layout/workspace/vines-view/form/execution-result/virtua/item/wrapper/raw-data-dialog.tsx';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { getFileNameByOssUrl } from '@/components/ui/vines-uploader/utils.ts';

interface IVirtuaExecutionResultGridWrapperProps {
  data: IVinesExecutionResultItem;
  children: React.ReactNode;

  src?: string;
}

export const VirtuaExecutionResultGridWrapper: React.FC<IVirtuaExecutionResultGridWrapperProps> = ({
  data,
  children,

  src,
}) => {
  const { t } = useTranslation();

  const handleDownload = useMemoizedFn(() => {
    if (!src) return;
    toast.promise(
      new Promise((resolve, reject) => {
        try {
          fetch(src)
            .then((res) => res.blob())
            .then((blob) => {
              fileTypeFromBlob(blob).then((filetype) => {
                const filename = getFileNameByOssUrl(src, `unknown.${filetype?.ext ?? 'png'}`);
                FileSaver.saveAs(blob, filename);
                void resolve(blob);
              });
            });
        } catch {
          reject();
        }
      }),
      {
        loading: t('common.utils.download.loading'),
        success: t('common.utils.download.success'),
        error: t('common.utils.download.error'),
      },
    );
  });

  return (
    <div className="group/vgi relative min-h-64 min-w-64 p-1">
      {children}
      <div className="absolute right-4 top-4 flex gap-1 opacity-0 transition-opacity group-hover/vgi:opacity-100 ">
        {src && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="rounded !p-1 [&_svg]:!size-3"
                icon={<Download />}
                variant="outline"
                size="small"
                onClick={handleDownload}
              />
            </TooltipTrigger>
            <TooltipContent>{t('common.utils.download.label')}</TooltipContent>
          </Tooltip>
        )}
        <VirtuaExecutionResultRawDataDialog data={data}>
          <Button className="rounded !p-1 [&_svg]:!size-3" icon={<Ellipsis />} variant="outline" size="small" />
        </VirtuaExecutionResultRawDataDialog>
      </div>
    </div>
  );
};
