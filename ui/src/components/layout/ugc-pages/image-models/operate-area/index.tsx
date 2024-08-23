import React from 'react';

import { useTranslation } from 'react-i18next';

import { IComfyuiModel } from '@/apis/comfyui-model/typings.ts';
import { IAssetItem } from '@/apis/ugc/typings.ts';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.tsx';
import { Tooltip, TooltipTrigger } from '@/components/ui/tooltip';

interface IOperateAreaProps {
  item: IAssetItem<IComfyuiModel>;
  trigger: React.ReactNode;
  tooltipTriggerContent?: string;
}

export const OperateArea: React.FC<IOperateAreaProps> = ({ item, trigger, tooltipTriggerContent }) => {
  const { t } = useTranslation();

  const id = item?.id;

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
        <DropdownMenuLabel>{t('ugc-page.image-models.ugc-view.operate-area.dropdown-label')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuSeparator />
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
