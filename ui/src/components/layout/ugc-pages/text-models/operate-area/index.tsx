import React, { useState } from 'react';

import { mutate } from 'swr';

import { Pencil, Trash } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { deleteLLMModel } from '@/apis/llm';
import { ILLMModel } from '@/apis/llm/typings.ts';
import { IAssetItem } from '@/apis/ugc/typings.ts';
import { TextModelInfoEditor } from '@/components/layout/ugc-pages/text-models/operate-area/text-model-info-editor';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
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
import { getI18nContent } from '@/utils';

interface IOperateAreaProps {
  item: IAssetItem<ILLMModel>;
  trigger: React.ReactNode;
  tooltipTriggerContent?: string;
}

export const OperateArea: React.FC<IOperateAreaProps> = ({ item, trigger, tooltipTriggerContent }) => {
  const { t } = useTranslation();

  const handelDelete = () => {
    toast.promise(deleteLLMModel(item.id), {
      loading: t('common.delete.loading'),
      success: () => {
        void mutate((key) => typeof key === 'string' && key.startsWith('/api/llm-models'));
        return t('common.delete.success');
      },
      error: t('common.delete.error'),
    });
  };

  const [textModelInfoEditorVisible, setTextModelInfoEditorVisible] = useState(false);

  return (
    <>
      <AlertDialog>
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
              <DropdownMenuItem onSelect={() => setTextModelInfoEditorVisible(true)}>
                <DropdownMenuShortcut className="ml-0 mr-2 mt-0.5">
                  <Pencil size={15} />
                </DropdownMenuShortcut>
                {t('ugc-page.image-models.ugc-view.operate-area.options.edit-info')}
              </DropdownMenuItem>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem className="text-red-10">
                  <DropdownMenuShortcut className="ml-0 mr-2 mt-0.5">
                    <Trash size={15} />
                  </DropdownMenuShortcut>
                  {t('common.utils.delete')}
                </DropdownMenuItem>
              </AlertDialogTrigger>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <AlertDialogContent
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('common.dialog.delete-confirm.title', { type: t('common.type.table-data') })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('common.dialog.delete-confirm.content', {
                type: t('common.type.table-data'),
                name: getI18nContent(item.displayName),
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.utils.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handelDelete}>{t('common.utils.confirm')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <TextModelInfoEditor
        model={item}
        visible={textModelInfoEditorVisible}
        setVisible={setTextModelInfoEditorVisible}
      />
    </>
  );
};
