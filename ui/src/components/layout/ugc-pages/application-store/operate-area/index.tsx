import React from 'react';

import { FileDown } from 'lucide-react';

import { IApplicationStoreItemDetail } from '@/apis/ugc/asset-typings.ts';
import { IAssetItem } from '@/apis/ugc/typings.ts';
import { UgcApplicationStoreUseTemplateDialog } from '@/components/layout/ugc-pages/application-store/use-template-dialog';
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
  item: IAssetItem<IApplicationStoreItemDetail>;
  trigger: React.ReactNode;
  tooltipTriggerContent?: string;
}

export const OperateArea: React.FC<IOperateAreaProps> = ({ item, trigger, tooltipTriggerContent }) => {
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
        <DropdownMenuLabel>应用市场操作</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <UgcApplicationStoreUseTemplateDialog item={item}>
            <DropdownMenuItem
              onSelect={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
            >
              <DropdownMenuShortcut className="ml-0 mr-2 mt-0.5">
                <FileDown size={15} />
              </DropdownMenuShortcut>
              使用该模板
            </DropdownMenuItem>
          </UgcApplicationStoreUseTemplateDialog>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
