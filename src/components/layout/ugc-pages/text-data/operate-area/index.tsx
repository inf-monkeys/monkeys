import React from 'react';

import { useSWRConfig } from 'swr';

import { Eraser, Trash } from 'lucide-react';
import { toast } from 'sonner';

import { IAssetItem } from '@/apis/ugc/typings.ts';
import { deleteAllVectorAllData, deleteVectorCollection } from '@/apis/vector';
import { IKnowledgeBaseFrontEnd } from '@/apis/vector/typings.ts';
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
  item: IAssetItem<IKnowledgeBaseFrontEnd>;
  trigger: React.ReactNode;
  tooltipTriggerContent?: string;
}

export const OperateArea: React.FC<IOperateAreaProps> = ({ item, trigger, tooltipTriggerContent }) => {
  const { mutate } = useSWRConfig();

  const handelDelete = () => {
    toast.promise(deleteVectorCollection(item.name), {
      loading: '正在删除数据集...',
      success: () => {
        void mutate((key) => typeof key === 'string' && key.startsWith('/api/vector/collections'));
        return '数据集删除成功';
      },
      error: '数据集删除失败',
    });
  };

  const handleClear = () => {
    toast(`确定要清空${item.displayName}数据集吗？`, {
      action: {
        label: '确定',
        onClick: () => {
          toast.promise(deleteAllVectorAllData(item.name), {
            loading: '正在清空数据集...',
            success: '数据集清空成功',
            error: '数据集清空失败',
          });
        },
      },
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
          <DropdownMenuLabel>数据集操作</DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem className="text-red-10" onClick={handleClear}>
            <DropdownMenuShortcut className="ml-0 mr-2 mt-0.5">
              <Eraser size={15} />
            </DropdownMenuShortcut>
            清空数据集
          </DropdownMenuItem>
          <AlertDialogTrigger asChild>
            <DropdownMenuItem className="text-red-10">
              <DropdownMenuShortcut className="ml-0 mr-2 mt-0.5">
                <Trash size={15} />
              </DropdownMenuShortcut>
              删除数据集
            </DropdownMenuItem>
          </AlertDialogTrigger>
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>确定要删除该文本数据集吗？</AlertDialogTitle>
          <AlertDialogDescription>删除后，该数据集将无法恢复，其中的数据也将被永久删除。</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction onClick={handelDelete}>删除</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
