import React, { useEffect, useState } from 'react';

import { ChevronDownIcon, Trash } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { EXTERNAL_TOOLS_CATEGORIES_MAP, TOOLS_ROOT_CATEGORIES_MAP } from '@/apis/tools/consts.tsx';
import { removeAssetFilterRules, useAssetFilterRuleList, useAssetPublicCategories } from '@/apis/ugc';
import { IListUgcDto, IUgcFilterRules } from '@/apis/ugc/typings.ts';
import { ACTION_TOOLS_CATEGORIES_MAP } from '@/apis/workflow/typings';
import { NON_FILTER_TYPE_LIST } from '@/components/layout/ugc/consts.ts';
import { IUgcCustomProps } from '@/components/layout/ugc/typings.ts';
import { IUgcViewFilterButtonProps, UgcViewFilterButton } from '@/components/layout/ugc/view/filter/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion.tsx';
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
import { cn, getI18nContent } from '@/utils';

export interface IUgcViewFilterListProps extends IUgcCustomProps {
  onChange: (filter: Partial<IListUgcDto['filter']>) => void;
  filterButtonProps: Omit<IUgcViewFilterButtonProps, keyof IUgcCustomProps>;
}

export const UgcViewFilterList: React.FC<IUgcViewFilterListProps> = ({
  assetType,
  assetKey,
  isMarket = false,
  onChange,
  filterButtonProps,
}) => {
  const { t } = useTranslation();

  const { data: assetFilterRules, mutate: mutateAssetFilterRules } = useAssetFilterRuleList(assetType, isMarket);
  const { data: assetPublicCategories } = useAssetPublicCategories(assetType, isMarket);

  const filterAreaVisible = !NON_FILTER_TYPE_LIST.includes(assetType) && !isMarket;
  const [current, setCurrent] = useState('all');
  const [searchValue, setSearchValue] = useState('');

  const [activeIndex, setActiveIndex] = useState<string[]>([]);

  // const blockCate = useMemo(() => {
  //   return assetType === 'tools'
  //     ? (ACTION_TOOLS_CATEGORY_INDEX_LIST.map((c) => {
  //         if (c === 'all' || c === 'human' || !_.get(ACTION_TOOLS_CATEGORIES_MAP, c)) return null;
  //         return {
  //           id: c,
  //           name: getI18nContent(_.get(ACTION_TOOLS_CATEGORIES_MAP, c)),
  //           type: 'tools',
  //           createdTimestamp: 0,
  //           updatedTimestamp: 0,
  //           isDeleted: false,
  //         };
  //       }).filter((c) => c) as unknown as IAssetPublicCategory[])
  //     : [];
  // }, [assetType]);

  useEffect(() => {
    if (current === 'all') {
      onChange({});
      return;
    }
    if (assetType === 'tools') {
      onChange({
        cate: current,
      });
    } else if (isMarket) {
      onChange({
        categoryIds: [current],
      });
    } else if (assetFilterRules) {
      const rule = assetFilterRules.find((r) => r.id === current);
      if (!rule) {
        toast.error(t('components.layout.ugc.view.filter.list.toast.filter-group-not-found'));
      } else {
        onChange(rule.rules);
      }
    }
  }, [current]);

  return (
    <div className="flex flex-col gap-2 p-1">
      {filterAreaVisible && (
        <div className="flex gap-2">
          <Input
            placeholder={t('components.layout.ugc.view.filter.list.placeholder')}
            value={searchValue}
            onChange={setSearchValue}
          />
          <UgcViewFilterButton assetType={assetType} assetKey={assetKey} {...filterButtonProps} defaultAddToFavourite />
        </div>
      )}
      {/*{assetType != 'tools' && (*/}
      <div
        className={cn(
          'group flex h-10 cursor-pointer items-center rounded-md transition-colors hover:bg-accent hover:text-accent-foreground',
          current === 'all' && 'border border-input bg-background text-accent-foreground shadow-sm',
        )}
        onClick={() => setCurrent('all')}
      >
        <div className="flex w-full items-center justify-between px-4 text-xs">
          <span>{t('common.utils.all')}</span>
        </div>
      </div>
      {/*)}*/}
      <ScrollArea className="h-[calc(100vh-15rem)]">
        <div className="flex flex-col gap-2">
          {assetType === 'tools' && !isMarket ? (
            <Accordion
              type="multiple"
              className="flex w-full flex-col gap-1 text-xs text-slateA-8 text-opacity-70"
              value={activeIndex}
              onValueChange={setActiveIndex}
            >
              {Object.keys(TOOLS_ROOT_CATEGORIES_MAP).map((rootName) => {
                const rootLabel = getI18nContent(TOOLS_ROOT_CATEGORIES_MAP[rootName]['label']);
                const rootIcon = TOOLS_ROOT_CATEGORIES_MAP[rootName]['icon'];
                const categoriesMap =
                  rootName === 'internal-tools' ? ACTION_TOOLS_CATEGORIES_MAP : EXTERNAL_TOOLS_CATEGORIES_MAP;
                return (
                  <AccordionItem key={rootName} value={rootName}>
                    <>
                      <AccordionTrigger>
                        <div className="group flex h-10 w-full cursor-pointer items-center rounded-md transition-colors hover:bg-accent hover:text-accent-foreground">
                          <div className="flex w-full items-center justify-between px-4 text-xs">
                            <div className="flex items-center gap-1">
                              <div className="w-[20px] [&_svg]:h-[16px] [&_svg]:w-[16px]">{rootIcon}</div>
                              <span>{rootLabel}</span>
                            </div>
                            <ChevronDownIcon className="chevron h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="flex flex-col gap-1 first:mt-1">
                        {Object.keys(categoriesMap).map((cateName) => {
                          const cateLabel = getI18nContent(categoriesMap[cateName]);
                          return (
                            <div
                              className={cn(
                                'group flex h-10 cursor-pointer items-center rounded-md transition-colors hover:bg-accent hover:text-accent-foreground',
                                current === cateName &&
                                  'border border-input bg-background text-accent-foreground shadow-sm',
                              )}
                              onClick={() => setCurrent(cateName)}
                              key={cateName}
                            >
                              <div className="flex w-full items-center justify-between pl-[calc(1rem+20px+0.25rem)] pr-4 text-xs">
                                <span>{cateLabel}</span>
                              </div>
                            </div>
                          );
                        })}
                      </AccordionContent>
                    </>
                  </AccordionItem>
                );
              })}
            </Accordion>
          ) : (
            (assetFilterRules || assetPublicCategories) &&
            (isMarket && assetPublicCategories
              ? assetPublicCategories
              : searchValue != '' && assetFilterRules
                ? assetFilterRules.filter((r) => r.name.includes(searchValue))
                : assetFilterRules || []
            ).map((rule: Partial<IUgcFilterRules>) => {
              return (
                <div
                  key={rule.id}
                  className={cn(
                    'group flex h-10 cursor-pointer items-center rounded-md transition-colors hover:bg-accent hover:text-accent-foreground',
                    current === rule.id && 'border border-input bg-background text-accent-foreground shadow-sm',
                  )}
                  onClick={() => setCurrent(rule.id!)}
                >
                  <div className="flex w-full items-center justify-between px-4 text-xs">
                    <span>{rule.name}</span>
                    {!isMarket && (
                      <AlertDialog>
                        <Tooltip content={t('common.utils.delete')}>
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
                            <AlertDialogTitle>
                              {t('common.dialog.delete-confirm.title', {
                                type: t('common.type.filter-group'),
                              })}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              {t('common.dialog.delete-confirm.content', {
                                name: rule.name,
                                type: t('common.type.filter-group'),
                              })}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t('common.utils.cancel')}</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => {
                                toast.promise(removeAssetFilterRules(rule.id!), {
                                  loading: t('common.delete.loading'),
                                  success: () => {
                                    void mutateAssetFilterRules();
                                    (current === rule.id || current === rule.id) && setCurrent('all');
                                    return t('common.delete.success');
                                  },
                                  error: t('common.delete.error'),
                                });
                              }}
                            >
                              {t('common.utils.confirm')}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
