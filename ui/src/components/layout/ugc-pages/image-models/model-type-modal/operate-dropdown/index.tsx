import React from 'react';

import { mutate } from 'swr';

import { Trash } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { deleteComfyuiModelType } from '@/apis/comfyui-model';
import { IComfyuiModelType } from '@/apis/comfyui-model/typings.ts';
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
} from '@/components/ui/alert-dialog.tsx';
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

interface IModelTypeOperateDropdownProps {
  item: IComfyuiModelType;
  trigger: React.ReactNode;
  tooltipTriggerContent?: string;
}

export const ModelTypeOperateDropdown: React.FC<IModelTypeOperateDropdownProps> = ({
  item,
  trigger,
  tooltipTriggerContent,
}) => {
  const { t } = useTranslation();

  const mutateModelList = () => mutate((key) => typeof key === 'string' && key.startsWith('/api/comfyui-models'));

  const handleDelete = async (typeId: string) => {
    toast.promise(deleteComfyuiModelType(typeId), {
      loading: t('common.operate.loading'),
      success: () => {
        mutateModelList();
        return t('common.operate.success');
      },
      error: t('common.operate.error'),
    });
  };

  return (
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
          <DropdownMenuLabel>{t('comfyui.comfyui-model-type.operate.dropdown-label')}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuSeparator />
            <AlertDialogTrigger asChild>
              <DropdownMenuItem className="text-red-10">
                <DropdownMenuShortcut className="ml-0 mr-2 mt-0.5">
                  <Trash size={15} />
                </DropdownMenuShortcut>
                {t('comfyui.comfyui-model-type.operate.options.delete')}
              </DropdownMenuItem>
            </AlertDialogTrigger>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t('common.dialog.delete-confirm.title', {
              type: t('common.type.comfyui-model-type'),
            })}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t('common.dialog.delete-confirm.content-without-name', {
              type: t('common.type.comfyui-model-type'),
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('common.utils.cancel')}</AlertDialogCancel>
          <AlertDialogAction onClick={() => handleDelete(item.id)}>{t('common.utils.confirm')}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
