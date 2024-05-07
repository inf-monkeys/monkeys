import React from 'react';

import { useSWRConfig } from 'swr';

import { useClipboard } from '@mantine/hooks';
import { Copy, Trash } from 'lucide-react';
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

interface IOperateAreaProps {
  item: IAssetItem<IMediaData>;
  trigger: React.ReactNode;
  tooltipTriggerContent?: string;
}

export const OperateArea: React.FC<IOperateAreaProps> = ({ item, trigger, tooltipTriggerContent }) => {
  const { mutate } = useSWRConfig();
  const clipboard = useClipboard({ timeout: 500 });

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
        <DropdownMenuLabel>富媒体数据操作</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={() => {
              clipboard.copy(item.url);
              toast.success('文件直链已复制');
            }}
          >
            <DropdownMenuShortcut className="ml-0 mr-2 mt-0.5">
              <Copy size={15} />
            </DropdownMenuShortcut>
            复制文件直链
          </DropdownMenuItem>
          <UgcDeleteDialog
            handleDelete={() => {
              toast.promise(deleteTrigger, {
                success: () => {
                  setTimeout(
                    () =>
                      void mutate((key) => typeof key === 'string' && key.startsWith('/api/media-files'), undefined, {
                        revalidate: true,
                      }),
                    1000,
                  );
                  return '删除成功';
                },
                error: '删除失败，请检查网络后重试',
                loading: '删除中......',
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
              删除
            </DropdownMenuItem>
          </UgcDeleteDialog>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
