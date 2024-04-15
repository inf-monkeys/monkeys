import React from 'react';

import { useNavigate, useParams } from '@tanstack/react-router';

import { MoreHorizontal, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { deleteWorkflow } from '@/apis/workflow';
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
  const { workflowId } = useFlowStore();

  const { teamId } = useParams({ from: '/$teamId/workspace/$workflowId/$pageId' });
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
                <p>删除工作流</p>
              </DropdownMenuItem>
            </AlertDialogTrigger>
          </DropdownMenuContent>
        </DropdownMenu>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确定要删除工作流吗？</AlertDialogTitle>
            <AlertDialogDescription>删除后无法恢复，且所有相关数据将被永久删除。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteWorkflow}>继续</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <TooltipContent>更多</TooltipContent>
    </Tooltip>
  );
};
