import React, { useState } from 'react';

import { FileDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { deleteApplicationOnStore } from '@/apis/application-store';
import { IApplicationStoreItemDetail } from '@/apis/ugc/asset-typings.ts';
import { IAssetItem } from '@/apis/ugc/typings.ts';
import { UgcApplicationStoreUseTemplateDialog } from '@/components/layout/ugc-pages/application-store/use-template-dialog';
import { useVinesTeam } from '@/components/router/guard/team';
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
import { toast } from 'sonner';
import { mutate } from 'swr';

interface IOperateAreaProps {
  item: IAssetItem<IApplicationStoreItemDetail>;
  trigger: React.ReactNode;
  tooltipTriggerContent?: string;
}

export const OperateArea: React.FC<IOperateAreaProps> = ({ item, trigger, tooltipTriggerContent }) => {
  const { t } = useTranslation();
  const { teamId } = useVinesTeam();

  const [deleteAlertDialogVisible, setDeleteAlertDialogVisible] = useState(false);

  const mutateStore = () =>
    mutate((key) => typeof key === 'string' && key.startsWith('/api/assets/workflow/marketplace'));

  const handleDeleteApplicationOnStore = async () => {
    toast.promise(deleteApplicationOnStore(item.id, 'workflow'), {
      loading: t('common.delete.loading'),
      success: () => {
        setDeleteAlertDialogVisible(false);
        void mutateStore();
        return t('common.delete.success');
      },
      error: t('common.delete.error'),
    });
  };

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
          <DropdownMenuLabel>{t('components.layout.ugc.import-dialog.dropdown')}</DropdownMenuLabel>
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
                {t('components.layout.ugc.import-dialog.use-template.title')}
              </DropdownMenuItem>
            </UgcApplicationStoreUseTemplateDialog>
          </DropdownMenuGroup>
          {item.teamId === teamId && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <AlertDialog open={deleteAlertDialogVisible} onOpenChange={setDeleteAlertDialogVisible}>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem
                      className="text-red-10"
                      onSelect={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                      }}
                    >
                      <DropdownMenuShortcut className="ml-0 mr-2 mt-0.5">
                        <FileDown size={15} />
                      </DropdownMenuShortcut>
                      {t('components.layout.ugc.import-dialog.delete')}
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                    }}
                  >
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {t('common.dialog.delete-confirm.title', {
                          type: t('common.type.workflow'),
                        })}
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {t('common.dialog.delete-confirm.content', {
                          type: t('common.type.workflow'),
                          name: getI18nContent(item.displayName) ?? t('common.utils.unknown'),
                        })}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t('common.utils.cancel')}</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDeleteApplicationOnStore()}>
                        {t('common.utils.confirm')}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuGroup>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
