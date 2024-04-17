import React, { useState } from 'react';

import { mutate } from 'swr';

import { FileUp, Trash } from 'lucide-react';

import { ISDModel } from '@/apis/sd/typings.ts';
import { IAssetItem } from '@/apis/ugc/typings.ts';
import { UgcDeleteDialog } from '@/components/layout/ugc/delete-dialog';
import { UgcPublishDialog } from '@/components/layout/ugc/publish-dialog';
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
  item: IAssetItem<ISDModel>;
  trigger: React.ReactNode;
  tooltipTriggerContent?: string;
}

export const OperateArea: React.FC<IOperateAreaProps> = ({ item, trigger, tooltipTriggerContent }) => {
  const [publishVisible, setPublishVisible] = useState(false);

  const [current, setCurrent] = useState<IAssetItem | undefined>();

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
        <DropdownMenuLabel>图像模型操作</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            onSelect={() => {
              setCurrent(item);
              setPublishVisible(true);
            }}
          >
            <DropdownMenuShortcut className="ml-0 mr-2 mt-0.5">
              <FileUp size={15} />
            </DropdownMenuShortcut>
            发布到市场
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <UgcDeleteDialog
            assetType={item?.assetType}
            ugcId={item?._id}
            afterOperate={() => {
              void mutate((key) => typeof key === 'string' && key.startsWith('/api/sd/models'), undefined, {
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

      <UgcPublishDialog
        visible={publishVisible}
        setVisible={setPublishVisible}
        ugcId={current?._id}
        item={current ?? {}}
      />
    </DropdownMenu>
  );
};
