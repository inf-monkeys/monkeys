import React from 'react';

import { mutate } from 'swr';

import { useClipboard } from '@mantine/hooks';
import _ from 'lodash';
import { Copy, Trash } from 'lucide-react';
import { toast } from 'sonner';

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
  const clipboard = useClipboard({ timeout: 500 });

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
            assetType={item?.assetType}
            ugcId={item?.id}
            afterOperate={() => {
              void mutate((key) => _.isArray(key) && key[0] === '/api/resources/list', undefined, {
                revalidate: true,
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
