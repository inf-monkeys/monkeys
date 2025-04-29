import React from 'react';

import { Trash } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { deleteWorkflowObservability, useWorkflowObservability } from '@/apis/workflow/observability';
import { IWorkflowObservability } from '@/apis/workflow/observability/typings';
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
import { useVinesFlow } from '@/package/vines-flow';

interface IWorkflowObservabilityOperateDropdownProps {
  item: IWorkflowObservability;
  trigger: React.ReactNode;
  tooltipTriggerContent?: string;
}

export const WorkflowObservabilityOperateDropdown: React.FC<IWorkflowObservabilityOperateDropdownProps> = ({
  item,
  trigger,
  tooltipTriggerContent,
}) => {
  const { t } = useTranslation();

  const { vines } = useVinesFlow();

  const { mutate } = useWorkflowObservability(vines.workflowId);

  const handleDelete = async (observabilityId: string) => {
    if (!vines.workflowId) {
      return;
    }
    toast.promise(deleteWorkflowObservability(vines.workflowId, observabilityId), {
      loading: t('common.operate.loading'),
      success: () => {
        mutate();
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
          <DropdownMenuLabel>{t('workspace.logs-view.observability.operate.dropdown-label')}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            {/* <DropdownMenuSeparator /> */}
            <AlertDialogTrigger asChild>
              <DropdownMenuItem className="text-red-10">
                <DropdownMenuShortcut className="ml-0 mr-2 mt-0.5">
                  <Trash size={15} />
                </DropdownMenuShortcut>
                {t('workspace.logs-view.observability.operate.options.delete')}
              </DropdownMenuItem>
            </AlertDialogTrigger>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t('common.dialog.delete-confirm.title', {
              type: t('workspace.logs-view.observability.operate.options.delete'),
            })}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t('common.dialog.delete-confirm.content-without-name', {
              type: t('workspace.logs-view.observability.operate.options.delete'),
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
