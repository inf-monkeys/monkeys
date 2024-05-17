import React from 'react';

import { useSWRConfig } from 'swr';

import { Trash } from 'lucide-react';
import { toast } from 'sonner';

import { deleteComfyuiWorkflow } from '@/apis/comfyui';
import { IComfyuiWorkflow } from '@/apis/comfyui/typings';
import { IAssetItem } from '@/apis/ugc/typings.ts';
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
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.tsx';
import { Tooltip, TooltipTrigger } from '@/components/ui/tooltip';

interface IOperateAreaProps {
  item: IAssetItem<IComfyuiWorkflow>;
  trigger: React.ReactNode;
  tooltipTriggerContent?: string;
}

export const OperateArea: React.FC<IOperateAreaProps> = ({ item, trigger, tooltipTriggerContent }) => {
  const { mutate } = useSWRConfig();

  const handelDelete = () => {
    toast.promise(deleteComfyuiWorkflow(item.id), {
      loading: '正在删除 ComfyUI 工作流...',
      success: () => {
        void mutate((key) => typeof key === 'string' && key.startsWith('/api/comfyui/workflows'));
        return 'ComfyUI 工作流删除成功';
      },
      error: 'ComfyUI 工作流删除失败',
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
          <DropdownMenuLabel>工作流操作</DropdownMenuLabel>
          <DropdownMenuSeparator />

          <AlertDialogTrigger asChild>
            <DropdownMenuItem className="text-red-10">
              <DropdownMenuShortcut className="ml-0 mr-2 mt-0.5">
                <Trash size={15} />
              </DropdownMenuShortcut>
              删除工作流
            </DropdownMenuItem>
          </AlertDialogTrigger>
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialogContent
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>确定要删除该 ComfyUI 工作流吗？</AlertDialogTitle>
          <AlertDialogDescription>删除后，该工作流将无法恢复。</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction onClick={handelDelete}>删除</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
