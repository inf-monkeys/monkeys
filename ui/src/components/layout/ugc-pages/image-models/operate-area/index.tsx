import React, { useState } from 'react';

import { Pencil } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { IComfyuiModel } from '@/apis/comfyui-model/typings.ts';
import { IAssetItem } from '@/apis/ugc/typings.ts';
import { ImageModelInfoEditor } from '@/components/layout/ugc-pages/image-models/operate-area/image-model-info-editor';
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
  item: IAssetItem<IComfyuiModel>;
  trigger: React.ReactNode;
  tooltipTriggerContent?: string;
}

export const OperateArea: React.FC<IOperateAreaProps> = ({ item, trigger, tooltipTriggerContent }) => {
  const { t } = useTranslation();

  const [imageModelInfoEditorVisible, setImageModelInfoEditorVisible] = useState(false);

  const id = item?.id;

  return (
    <>
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
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setImageModelInfoEditorVisible(true);
              }}
            >
              <DropdownMenuShortcut className="ml-0 mr-2 mt-0.5">
                <Pencil size={15} />
              </DropdownMenuShortcut>
              {t('ugc-page.image-models.ugc-view.operate-area.options.edit-info')}
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <ImageModelInfoEditor
        visible={imageModelInfoEditorVisible}
        setVisible={setImageModelInfoEditorVisible}
        model={item}
      />
    </>
  );
};
