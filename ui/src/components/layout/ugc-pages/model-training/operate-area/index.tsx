import React from 'react';

import { mutate } from 'swr';

import { Trash } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { deleteModelTraining } from '@/apis/model-training';
import { IModelTraining } from '@/apis/model-training/typings.ts';
import { IAssetItem } from '@/apis/ugc/typings.ts';
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
  item: IAssetItem<IModelTraining>;
  trigger: React.ReactNode;
  tooltipTriggerContent?: string;
}

export const OperateArea: React.FC<IOperateAreaProps> = ({ item, trigger, tooltipTriggerContent }) => {
  const { t } = useTranslation();

  const handleDelete = async () => {
    try {
      await deleteModelTraining(item.id);
      // 先清除已删除项的缓存，设置为 undefined 并禁用重新验证，避免组件尝试重新获取已删除的数据
      await mutate(`/api/model-training/${item.id}`, undefined, { revalidate: false });
      // 刷新列表
      await mutate((key) => typeof key === 'string' && key.startsWith('/api/model-training'));
      toast.success(t('common.delete.success'));
    } catch (error) {
      toast.error(t('common.delete.error'));
    }
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
        <DropdownMenuLabel>模型训练操作</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem className="text-red-10" onSelect={handleDelete}>
            <DropdownMenuShortcut className="ml-0 mr-2 mt-0.5">
              <Trash size={15} />
            </DropdownMenuShortcut>
            {t('common.utils.delete')}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
