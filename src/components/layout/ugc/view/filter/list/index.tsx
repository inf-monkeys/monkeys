import React, { useMemo, useState } from 'react';

import { Trash } from 'lucide-react';
import { toast } from 'sonner';

import { removeAssetFilterRules, useAssetFilterRuleList } from '@/apis/ugc';
import { IListUgcDto } from '@/apis/ugc/typings.ts';
import { IUgcCustomProps } from '@/components/layout/ugc/typings.ts';
import { IUgcViewFilterButtonProps, UgcViewFilterButton } from '@/components/layout/ugc/view/filter/button';
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
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/utils';

export interface IUgcViewFilterListProps extends IUgcCustomProps {
  onChange: (filter: Partial<IListUgcDto['filter']>) => void;
  filterButtonProps: Omit<IUgcViewFilterButtonProps, keyof IUgcCustomProps>;
}

export const UgcViewFilterList: React.FC<IUgcViewFilterListProps> = ({
  assetType,
  assetKey,
  onChange,
  filterButtonProps,
}) => {
  const { data: assetFilterRules, mutate } = useAssetFilterRuleList(assetType);

  const [current, setCurrent] = useState('all');
  const [searchValue, setSearchValue] = useState('');

  useMemo(() => {
    setTimeout(() => {
      if (current === 'all') {
        onChange({});
        return;
      }
      if (assetFilterRules) {
        const rule = assetFilterRules.find((r) => r._id === current);
        if (!rule) {
          toast.error('分组不存在，请刷新后重试');
        } else {
          onChange(rule.rules);
        }
      }
    });
  }, [current]);

  return (
    <div className="flex flex-col gap-2 p-1">
      <div className="flex gap-2">
        <Input placeholder="搜索分组名称" value={searchValue} onChange={setSearchValue} />
        <UgcViewFilterButton assetType={assetType} assetKey={assetKey} {...filterButtonProps} defaultAddToFavourite />
      </div>
      <div
        className={cn(
          'group flex h-10 cursor-pointer items-center rounded-md transition-colors hover:bg-accent hover:text-accent-foreground',
          current === 'all' && 'bg-accent text-accent-foreground',
        )}
        onClick={() => setCurrent('all')}
      >
        <div className="flex w-full items-center justify-between px-4 text-xs">
          <span>全部</span>
        </div>
      </div>
      {assetFilterRules &&
        (searchValue != '' ? assetFilterRules.filter((r) => r.name.includes(searchValue)) : assetFilterRules).map(
          (rule, index) => {
            return (
              <div
                key={index}
                className={cn(
                  'group flex h-10 cursor-pointer items-center rounded-md transition-colors hover:bg-accent hover:text-accent-foreground',
                  current === rule._id && 'bg-accent text-accent-foreground',
                )}
                onClick={() => setCurrent(rule._id)}
              >
                <div className="flex w-full items-center justify-between px-4 text-xs">
                  <span>{rule.name}</span>
                  <AlertDialog>
                    <Tooltip content="删除">
                      <TooltipTrigger asChild>
                        <AlertDialogTrigger asChild>
                          <div
                            className="p-2"
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                          >
                            <Trash size={14} className="opacity-0 transition-opacity group-hover:opacity-75" />
                          </div>
                        </AlertDialogTrigger>
                      </TooltipTrigger>
                    </Tooltip>
                    <AlertDialogContent
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      <AlertDialogHeader>
                        <AlertDialogTitle>确定要删除分组</AlertDialogTitle>
                        <AlertDialogDescription>确定要删除分组「{rule.name}」？此操作不可恢复。</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => {
                            toast.promise(removeAssetFilterRules(rule._id), {
                              loading: '操作中...',
                              success: () => {
                                void mutate();
                                current === rule._id && setCurrent('all');
                                return '删除成功';
                              },
                              error: '删除失败，请检查网络后重试',
                            });
                          }}
                        >
                          确认删除
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            );
          },
        )}
    </div>
  );
};
