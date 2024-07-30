import React, { useEffect, useMemo, useState } from 'react';

import { ToolCategory } from '@inf-monkeys/monkeys';
import { ChevronRightIcon, LayoutGrid, Trash } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import {
  EXTERNAL_TOOLS_CATEGORIES_MAP,
  INTERNAL_TOOLS_NAMESPACE,
  TOOLS_ROOT_CATEGORIES_MAP,
} from '@/apis/tools/consts.tsx';
import { ICommonTool, IWorkflowTool } from '@/apis/tools/typings.ts';
import { removeAssetFilterRules, useAssetFilterRuleList, useAssetPublicCategories } from '@/apis/ugc';
import { IAssetItem, IListUgcDto, IUgcFilterRules } from '@/apis/ugc/typings.ts';
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

  // special for tools
  toolsData?: IAssetItem<ICommonTool>[];
}

export const UgcViewFilterList: React.FC<IUgcViewFilterListProps> = ({
  assetType,
  assetKey,
  isMarket = false,
  onChange,
  filterButtonProps,
  toolsData: rawToolsData,
}) => {
  const { t } = useTranslation();

  const { data: assetFilterRules, mutate: mutateAssetFilterRules } = useAssetFilterRuleList(assetType, isMarket);
  const { data: assetPublicCategories } = useAssetPublicCategories(assetType, isMarket);

  const filterAreaVisible = !NON_FILTER_TYPE_LIST.includes(assetType) && !isMarket;
  const [current, setCurrent] = useState('all');
  const [searchValue, setSearchValue] = useState('');

  const [activeIndex, setActiveIndex] = useState<string[]>([]);

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

  // special for tools
  const toolsData = useMemo(() => {
    if (assetType != 'tools' || isMarket || !rawToolsData) return undefined;
    const internalTools = rawToolsData.filter((tool) =>
      INTERNAL_TOOLS_NAMESPACE.includes((tool as IAssetItem<IWorkflowTool>).namespace),
    );
    const internal = Object.keys(ACTION_TOOLS_CATEGORIES_MAP).reduce((acc, curr) => {
      acc[curr] =
        internalTools.filter((tool) => (tool as IAssetItem<IWorkflowTool>).categories?.includes(curr as ToolCategory))
          .length ?? 0;
      return acc;
    }, {});
    const externalTools = rawToolsData.filter(
      (tool) => !INTERNAL_TOOLS_NAMESPACE.includes((tool as IAssetItem<IWorkflowTool>).namespace),
    );
    const external = Object.keys(EXTERNAL_TOOLS_CATEGORIES_MAP).reduce((acc, curr) => {
      acc[curr] =
        externalTools.filter((tool) => (tool as IAssetItem<IWorkflowTool>).categories?.includes(curr as ToolCategory))
          .length ?? 0;
      return acc;
    }, {});
    return {
      total: rawToolsData.length,
      'internal-tools': {
        ...internal,
        total: internalTools.length,
      },
      'external-tools': {
        ...external,
        total: externalTools.length,
      },
    };
  }, [rawToolsData, assetType, isMarket]);

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
      <div
        className={cn(
          'group flex h-10 cursor-pointer items-center rounded-md transition-colors hover:bg-accent hover:text-accent-foreground',
          current === 'all' ? 'border border-input bg-background text-accent-foreground shadow-sm' : 'p-[1px]',
        )}
        onClick={() => setCurrent('all')}
      >
        <div className="flex w-full items-center justify-between px-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-[20px] [&_svg]:h-[16px] [&_svg]:w-[16px]">
              <LayoutGrid />
            </div>
            <span>
              {t('common.utils.all') +
                (assetType === 'tools' && !isMarket
                  ? t('common.utils.counter', {
                      count: toolsData?.total,
                    })
                  : '')}
            </span>
          </div>
        </div>
      </div>
      <ScrollArea className="h-[calc(100vh-15rem)]">
        <div className="flex flex-col gap-2">
          {assetType === 'tools' && !isMarket ? (
            <Accordion
              type="multiple"
              className="flex w-full flex-col gap-2 text-sm text-slateA-8 text-opacity-70"
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
                        <div className="group flex h-10 w-full cursor-pointer items-center rounded-md p-[1px] transition-colors hover:bg-accent hover:text-accent-foreground">
                          <div className="flex w-full items-center justify-between px-4 text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-[20px] [&_svg]:h-[16px] [&_svg]:w-[16px]">{rootIcon}</div>

                              <span className="!font-normal">
                                {rootLabel +
                                  t('common.utils.counter', {
                                    count: toolsData?.[rootName]['total'],
                                  })}
                              </span>
                            </div>
                            <ChevronRightIcon className="chevron h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="flex flex-col gap-2 first:mt-2">
                        {Object.keys(categoriesMap).map((cateName) => {
                          const cateLabel = getI18nContent(categoriesMap[cateName]);
                          return (
                            <div
                              className={cn(
                                'group flex h-10 cursor-pointer items-center rounded-md transition-colors hover:bg-accent hover:text-accent-foreground',
                                current === cateName
                                  ? 'border border-input bg-background text-accent-foreground shadow-sm'
                                  : 'p-[1px]',
                              )}
                              onClick={() => setCurrent(cateName)}
                              key={cateName}
                            >
                              <span className="pl-[calc(1rem+20px+0.5rem)] pr-4 text-sm !font-normal">
                                {cateLabel +
                                  t('common.utils.counter', {
                                    count: toolsData?.[rootName][cateName],
                                  })}
                              </span>
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
                    current === rule.id
                      ? 'border border-input bg-background text-accent-foreground shadow-sm'
                      : 'p-[1px]',
                  )}
                  onClick={() => setCurrent(rule.id!)}
                >
                  <div className="flex w-full items-center justify-between px-4 text-sm">
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
