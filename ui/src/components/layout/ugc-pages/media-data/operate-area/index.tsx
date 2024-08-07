import React from 'react';

import { useSWRConfig } from 'swr';

import { Copy, Trash } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useDeleteMediaData } from '@/apis/media-data';
import { IMediaData } from '@/apis/media-data/typings.ts';
import { IAssetItem } from '@/apis/ugc/typings.ts';
import { UgcDeleteDialog } from '@/components/layout/ugc/delete-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.tsx';
import { Tooltip, TooltipTrigger } from '@/components/ui/tooltip';
import { useCopy } from '@/hooks/use-copy.ts';

interface IOperateAreaProps {
  item: IAssetItem<IMediaData>;
  trigger: React.ReactNode;
  tooltipTriggerContent?: string;
}

export const OperateArea: React.FC<IOperateAreaProps> = ({ item, trigger, tooltipTriggerContent }) => {
  const { t } = useTranslation();

  const { mutate } = useSWRConfig();
  const { copy } = useCopy({ timeout: 500 });

  const { trigger: deleteTrigger } = useDeleteMediaData(item.id);

  return (
    <DropdownMenu>
      {tooltipTriggerContent ? (
        <Tooltip content={tooltipTriggerContent}>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
          </TooltipTrigger>
        </Tooltip>
      ) : (
        <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      )}

      <DropdownMenuContent
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
      >
        <DropdownMenuLabel>{t('ugc-page.media-data.ugc-view.operate-area.dropdown-label')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => copy(item.url)}>
            <DropdownMenuShortcut className="ml-0 mr-2 mt-0.5">
              <Copy size={15} />
            </DropdownMenuShortcut>
            {t('ugc-page.media-data.ugc-view.operate-area.options.copy-link')}
          </DropdownMenuItem>
          <UgcDeleteDialog
            handleDelete={() => {
              toast.promise(deleteTrigger, {
                success: () => {
                  void mutate((key) => typeof key === 'string' && key.startsWith('/api/media-files'), undefined, {
                    revalidate: true,
                  });
                  return t('common.delete.success');
                },
                error: t('common.delete.error'),
                loading: t('common.delete.loading'),
              });
            }}
          >
            <DropdownMenuItem
              className="text-red-10"
              onSelect={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
            >
              <DropdownMenuShortcut className="ml-0 mr-2 mt-0.5">
                <Trash size={15} />
              </DropdownMenuShortcut>
              {t('common.utils.delete')}
            </DropdownMenuItem>
          </UgcDeleteDialog>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
