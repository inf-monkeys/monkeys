import React from 'react';

import { FileDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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

import { UgcComfyUIWorkflowStoreUseWorkflowDialog } from '../use-workflow-dialog';

interface IOperateAreaProps {
  item: IAssetItem<IComfyuiWorkflow>;
  trigger: React.ReactNode;
  tooltipTriggerContent?: string;
}

export const OperateArea: React.FC<IOperateAreaProps> = ({ item, trigger, tooltipTriggerContent }) => {
  const { t } = useTranslation();

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
        <DropdownMenuLabel>{t('components.layout.ugc.import-dialog.dropdown')}</DropdownMenuLabel>
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
              {t('components.layout.ugc.import-dialog.import-workflow.title')}
            </DropdownMenuItem>
          </UgcComfyUIWorkflowStoreUseWorkflowDialog>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
