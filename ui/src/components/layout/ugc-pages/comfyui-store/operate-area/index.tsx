import React from 'react';

import { IComfyuiWorkflow } from '@/apis/comfyui/typings';
import { IAssetItem } from '@/apis/ugc/typings.ts';
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
import { FileDown } from 'lucide-react';
import { UgcComfyUIWorkflowStoreUseWorkflowDialog } from '../use-workflow-dialog';

interface IOperateAreaProps {
  item: IAssetItem<IComfyuiWorkflow>;
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
        <DropdownMenuLabel>操作</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <UgcComfyUIWorkflowStoreUseWorkflowDialog item={item}>
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
          </UgcComfyUIWorkflowStoreUseWorkflowDialog>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
