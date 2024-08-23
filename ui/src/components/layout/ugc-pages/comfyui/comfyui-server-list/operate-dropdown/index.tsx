import React, { useState } from 'react';

import { KeyedMutator } from 'swr/_internal';

import { CloudDownload, Trash } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { deleteComfyuiServer } from '@/apis/comfyui';
import { IComfyuiServer } from '@/apis/comfyui/typings.ts';
import { manualUpdateModelListFromServer } from '@/apis/comfyui-model';
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

interface IComfyuiServerListOperateDropdownProps {
  item: IComfyuiServer;
  trigger: React.ReactNode;
  tooltipTriggerContent?: string;
  mutate: KeyedMutator<IComfyuiServer[] | undefined>;
}

export const ComfyuiServerListOperateDropdown: React.FC<IComfyuiServerListOperateDropdownProps> = ({
  item,
  trigger,
  tooltipTriggerContent,
  mutate,
}) => {
  const { t } = useTranslation();

  const [updating, setUpdating] = useState(false);

  const handleDelete = async (address: string) => {
    toast.promise(deleteComfyuiServer(address), {
      loading: t('common.operate.loading'),
      success: () => {
        mutate();
        return t('common.operate.success');
      },
      error: t('common.operate.error'),
    });
  };

  const handleManualUpdate = async (serverId: string) => {
    setUpdating(true);
    toast.promise(manualUpdateModelListFromServer(serverId), {
      loading: t('common.update.loading'),
      success: (data) => {
        return t('comfyui.comfyui-server.operate.manual-update.success', {
          ...data,
        });
      },
      error: t('common.update.error'),
      finally: () => setUpdating(false),
    });
  };

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
        <DropdownMenuLabel>{t('comfyui.comfyui-server.operate.dropdown-label')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={() => handleManualUpdate(item.id)} disabled={updating}>
            <DropdownMenuShortcut className="ml-0 mr-2 mt-0.5">
              <CloudDownload size={15} />
            </DropdownMenuShortcut>
            {t('comfyui.comfyui-server.operate.options.manual-update')}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <DropdownMenuItem className="text-red-10" disabled={item.isDefault}>
                <DropdownMenuShortcut className="ml-0 mr-2 mt-0.5">
                  <Trash size={15} />
                </DropdownMenuShortcut>
                {t('comfyui.comfyui-server.operate.options.delete')}
              </DropdownMenuItem>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {t('common.dialog.delete-confirm.title', {
                    type: t('common.type.comfyui-server'),
                  })}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {t('common.dialog.delete-confirm.content-without-name', {
                    type: t('common.type.comfyui-server'),
                  })}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('common.utils.cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleDelete(item.address)}>
                  {t('common.utils.confirm')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
