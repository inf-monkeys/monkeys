import React, { useMemo, useState } from 'react';

import _ from 'lodash';
import { Trash } from 'lucide-react';
import { toast } from 'sonner';

import { removeAssetFilterRules, useAssetFilterRuleList, useAssetPublicCategories } from '@/apis/ugc';
import { IAssetPublicCategory, IListUgcDto } from '@/apis/ugc/typings.ts';
import { BLOCK_CATEGORY_SORT_INDEX_LIST } from '@/apis/workflow/consts.ts';
import { IAppCategoryNameMap } from '@/apis/workflow/typings';
import { NON_FILTER_TYPE_LIST } from '@/components/layout/ugc/consts.ts';
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
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { Tooltip, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/utils';

export interface IUgcViewFilterListProps extends IUgcCustomProps {
  onChange: (filter: Partial<IListUgcDto['filter']>) => void;
  filterButtonProps: Omit<IUgcViewFilterButtonProps, keyof IUgcCustomProps>;
}

// million-ignore
export const UgcViewFilterList: React.FC<IUgcViewFilterListProps> = ({
  assetType,
  assetKey,
  isMarket = false,
  onChange,
  filterButtonProps,
}) => {
  const { data: assetFilterRules, mutate: mutateAssetFilterRules } = useAssetFilterRuleList(assetType, isMarket);
  const { data: assetPublicCategories } = useAssetPublicCategories(assetType, isMarket);

  const filterAreaVisible = !NON_FILTER_TYPE_LIST.includes(assetType) && !isMarket;
  const [current, setCurrent] = useState('all');
  const [searchValue, setSearchValue] = useState('');

  const blockCate = useMemo(() => {
    return assetType === 'block'
      ? (BLOCK_CATEGORY_SORT_INDEX_LIST.map((c) => {
          if (c === 'all' || c === 'human' || !_.get(IAppCategoryNameMap, c)) return null;
          return {
            _id: c,
            name: _.get(IAppCategoryNameMap, c),
            type: 'block',
            createdTimestamp: 0,
            updatedTimestamp: 0,
            isDeleted: false,
          };
        }).filter((c) => c) as unknown as IAssetPublicCategory[])
      : [];
  }, [assetType]);

  useMemo(() => {
    setTimeout(() => {
      if (current === 'all') {
        onChange({});
        return;
      }
      if (assetType === 'block') {
        onChange({
          cate: current,
        });
      } else if (isMarket) {
        onChange({
          categoryIds: [current],
        });
      } else if (assetFilterRules) {
        const rule = assetFilterRules.find((r) => r.uuid === current);
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
      {filterAreaVisible && (
        <div className="flex gap-2">
          <Input placeholder="搜索分组名称" value={searchValue} onChange={setSearchValue} />
          <UgcViewFilterButton assetType={assetType} assetKey={assetKey} {...filterButtonProps} defaultAddToFavourite />
        </div>
      )}
      <div
        className={cn(
          'group flex h-10 cursor-pointer items-center rounded-md transition-colors hover:bg-accent hover:text-accent-foreground',
          current === 'all' && 'border border-input bg-background text-accent-foreground shadow-sm',
        )}
        onClick={() => setCurrent('all')}
      >
        <div className="flex w-full items-center justify-between px-4 text-xs">
          <span>全部</span>
        </div>
      </div>
      <ScrollArea className="h-[calc(100vh-15rem)]">
        <div className="flex flex-col gap-2">
          {(assetFilterRules || assetPublicCategories) &&
            (isMarket && assetPublicCategories
              ? assetPublicCategories
              : assetType === 'block'
                ? blockCate
                : searchValue != '' && assetFilterRules
                  ? assetFilterRules.filter((r) => r.name.includes(searchValue))
                  : assetFilterRules || []
            ).map((rule, index) => {
              return (
                <div
                  key={index}
                  className={cn(
                    'group flex h-10 cursor-pointer items-center rounded-md transition-colors hover:bg-accent hover:text-accent-foreground',
                    (current === rule.id || current === rule._id) &&
                      'border border-input bg-background text-accent-foreground shadow-sm',
                  )}
                  onClick={() => setCurrent(rule.id || rule._id)}
                >
                  <div className="flex w-full items-center justify-between px-4 text-xs">
                    <span>{rule.name}</span>
                    {assetType != 'block' && !isMarket && (
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
                            <AlertDialogTitle>分组删除确认</AlertDialogTitle>
                            <AlertDialogDescription>
                              确定要删除分组「{rule.name}」？此操作不可恢复。
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>取消</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => {
                                toast.promise(removeAssetFilterRules(rule.id), {
                                  loading: '操作中...',
                                  success: () => {
                                    void mutateAssetFilterRules();
                                    (current === rule.id || current === rule._id) && setCurrent('all');
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
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </ScrollArea>
    </div>
  );
};
