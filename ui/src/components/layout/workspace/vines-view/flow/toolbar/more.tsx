import React from 'react';

import { useNavigate } from '@tanstack/react-router';

import { MoreHorizontal, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { deleteWorkflow } from '@/apis/workflow';
import { useVinesTeam } from '@/components/router/guard/team.tsx';
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
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Route } from '@/pages/$teamId/workspace/$workflowId/$pageId';
import { useFlowStore } from '@/store/useFlowStore';

interface IMoreToolbarProps extends React.ComponentPropsWithoutRef<'div'> {}

export const MoreToolbar: React.FC<IMoreToolbarProps> = () => {
  const { t } = useTranslation();

  const workflowId = useFlowStore((s) => s.workflowId);

  const { teamId } = useVinesTeam();
  const navigate = useNavigate({ from: Route.fullPath });

  const handleDeleteWorkflow = () => {
    toast.promise(deleteWorkflow(workflowId), {
      loading: '删除中',
      success: () => {
        void navigate({ to: '/$teamId', params: { teamId } });
        return '删除成功';
      },
      error: '删除失败，请检查网络后重试',
    });
  };

  return (
    <Tooltip>
      <AlertDialog>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <TooltipTrigger asChild>
              <Button className="[&_svg]:stroke-gold-12" variant="borderless" size="small" icon={<MoreHorizontal />} />
            </TooltipTrigger>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="start" sideOffset={12}>
            <AlertDialogTrigger asChild>
              <DropdownMenuItem className="flex items-center gap-2 text-red-10">
                <Trash2 strokeWidth={1.5} size={16} />
                <p>{t('workspace.flow-view.tooltip.more.del-workflow.button')}</p>
              </DropdownMenuItem>
            </AlertDialogTrigger>
          </DropdownMenuContent>
        </DropdownMenu>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('workspace.flow-view.tooltip.more.del-workflow.title')}</AlertDialogTitle>
            <AlertDialogDescription>{t('workspace.flow-view.tooltip.more.del-workflow.desc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('workspace.flow-view.tooltip.more.del-workflow.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteWorkflow}>
              {t('workspace.flow-view.tooltip.more.del-workflow.action')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <TooltipContent>{t('workspace.flow-view.tooltip.more.tip')}</TooltipContent>
    </Tooltip>
  );
};
