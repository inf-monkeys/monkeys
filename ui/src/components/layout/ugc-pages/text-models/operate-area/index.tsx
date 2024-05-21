import React from 'react';

import { mutate } from 'swr';

import { FileUp, Trash } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { ILLMModel } from '@/apis/llm/typings.ts';
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
  item: IAssetItem<ILLMModel>;
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
        <DropdownMenuLabel>{t('ugc-page.text-models.ugc-view.operate-area.dropdown-label')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <UgcPublishDialog ugcId={item?.id} item={item ?? {}}>
            <DropdownMenuItem
              onSelect={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
            >
              <DropdownMenuShortcut className="ml-0 mr-2 mt-0.5">
                <FileUp size={15} />
              </DropdownMenuShortcut>
              {t('ugc-page.text-models.ugc-view.operate-area.options.publish')}
            </DropdownMenuItem>
          </UgcPublishDialog>
          <DropdownMenuSeparator />
          <UgcDeleteDialog
            assetType={item?.assetType}
            ugcId={item?.id}
            afterOperate={() => {
              void mutate((key) => typeof key === 'string' && key.startsWith('/api/llm/models'), undefined, {
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
              {t('common.utils.delete')}
            </DropdownMenuItem>
          </UgcDeleteDialog>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
