import React from 'react';

import { useSWRConfig } from 'swr';

import { FileUp, Trash } from 'lucide-react';
import { toast } from 'sonner';

import { deleteDatabase } from '@/apis/table-data';
import { ITableData } from '@/apis/table-data/typings.ts';
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
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.tsx';
import { Tooltip, TooltipTrigger } from '@/components/ui/tooltip';

interface IOperateAreaProps {
  item: IAssetItem<ITableData>;
  trigger: React.ReactNode;
  tooltipTriggerContent?: string;
}

export const OperateArea: React.FC<IOperateAreaProps> = ({ item, trigger, tooltipTriggerContent }) => {
  const { mutate } = useSWRConfig();

  const handelDelete = () => {
    toast.promise(deleteDatabase(item.uuid), {
      loading: '正在删除表格数据...',
      success: () => {
        void mutate((key) => typeof key === 'string' && key.startsWith('/api/sql-knowledge-bases'));
        return '表格数据删除成功';
      },
      error: '表格数据删除失败',
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
          <DropdownMenuLabel>表格数据操作</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem>
              <DropdownMenuShortcut className="ml-0 mr-2 mt-0.5">
                <FileUp size={15} />
              </DropdownMenuShortcut>
              发布到市场
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <AlertDialogTrigger asChild>
              <DropdownMenuItem className="text-red-10">
                <DropdownMenuShortcut className="ml-0 mr-2 mt-0.5">
                  <Trash size={15} />
                </DropdownMenuShortcut>
                删除
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
          <AlertDialogTitle>确定要删除该表格数据吗？</AlertDialogTitle>
          <AlertDialogDescription>删除后，该表格数据将无法恢复，其中的数据也将被永久删除。</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction onClick={handelDelete}>删除</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
