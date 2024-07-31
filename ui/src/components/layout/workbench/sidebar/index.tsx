import React, { useRef, useState } from 'react';

import { Link } from '@tanstack/react-router';

import { useDebounceEffect } from 'ahooks';
import { motion } from 'framer-motion';
import { keyBy, map } from 'lodash';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useWorkspacePages } from '@/apis/pages';
import { IPinPage } from '@/apis/pages/typings.ts';
import { EMOJI2LUCIDE_MAPPER } from '@/components/layout-wrapper/workspace/space/sidebar/tabs/tab.tsx';
import { useVinesTeam } from '@/components/router/guard/team.tsx';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label.tsx';
import { Separator } from '@/components/ui/separator.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { VinesIcon } from '@/components/ui/vines-icon';
import { VinesLucideIcon } from '@/components/ui/vines-icon/lucide';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { cn, getI18nContent } from '@/utils';

interface IWorkbenchSidebarProps extends React.ComponentPropsWithoutRef<'div'> {
  groupId: string;
  setGroupId: React.Dispatch<React.SetStateAction<string>>;
}

export const WorkbenchSidebar: React.FC<IWorkbenchSidebarProps> = ({ groupId, setGroupId }) => {
  const { t } = useTranslation();

  const { teamId } = useVinesTeam();

  const { data } = useWorkspacePages();
  const [visible, setVisible] = useState(true);

  const originalPages = data?.pages ?? [];
  const originalGroups = data?.groups ?? [];

  const pagesMap = keyBy(originalPages, 'id');
  const lists = map(originalGroups, ({ pageIds, ...attr }) => ({
    ...attr,
    pages: map(pageIds, (pageId) => pagesMap[pageId]),
  }))
    .filter((it) => it.pages?.length)
    .sort((a) => (a.isBuiltIn ? -1 : 1));

  const [currentPage, setCurrentPage] = useLocalStorage<Partial<IPinPage>>('vines-ui-workbench-page', {});

  const prevPageRef = useRef<string>();
  useDebounceEffect(
    () => {
      const currentPageId = currentPage?.id;

      if (originalGroups?.length) {
        const defGroup = originalGroups.find((it) => it.isBuiltIn);
        const latestGroup = currentPageId
          ? originalGroups.find((it) => it.pageIds.includes(currentPageId))
          : defGroup?.pageIds?.length
            ? defGroup
            : originalGroups?.[0];
        if (latestGroup) {
          setGroupId(latestGroup.id);

          if (!currentPageId) {
            const page = originalPages.find((it) => it.id === (latestGroup.pageIds?.[0] ?? ''));
            if (page && prevPageRef.current !== page.id) {
              setCurrentPage(page);
              prevPageRef.current = page.id;
            }
          }
        }
      }

      if (currentPageId) {
        if (!originalPages?.find((page) => page.id === currentPageId)) {
          setCurrentPage({});
        }
      }
    },
    [originalPages, originalGroups],
    { wait: 180 },
  );

  return (
    <div className="flex h-full max-w-64">
      <motion.div
        className="flex flex-col gap-4 overflow-hidden [&_h1]:line-clamp-1 [&_span]:line-clamp-1"
        initial={{ width: 256, paddingRight: 16 }}
        animate={{
          width: visible ? 256 : 0,
          paddingRight: visible ? 16 : 0,
          transition: { duration: 0.2 },
        }}
      >
        <div className="flex items-center gap-2 px-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                icon={<ChevronLeft />}
                className="!size-8 !p-1"
                onClick={() => setVisible(false)}
                variant="outline"
              />
            </TooltipTrigger>
            <TooltipContent>{visible ? t('common.sidebar.hide') : t('common.sidebar.show')}</TooltipContent>
          </Tooltip>
          <h1 className="text-base font-bold">{t('components.layout.main.sidebar.list.workbench.label')}</h1>
        </div>
        <div className="grid">
          {lists.map(({ id, displayName, isBuiltIn, pages }) => (
            <div key={id} className="space-y-1">
              {!isBuiltIn && <Label className="text-xs">{displayName}</Label>}
              {pages?.map((page) => {
                if (!page) {
                  return null;
                }

                const info = page?.workflow || page?.agent;
                const viewIcon = page?.instance?.icon ?? '';
                const pageId = page?.id ?? '';

                return (
                  <div
                    key={pageId}
                    className={cn(
                      'flex cursor-pointer items-start space-x-2 rounded-md transition-colors hover:bg-accent hover:text-accent-foreground',
                      currentPage?.id === pageId && id === groupId
                        ? 'border border-input bg-background p-2 text-accent-foreground'
                        : 'p-[calc(0.5rem+1px)]',
                    )}
                    onClick={() => {
                      setCurrentPage(page);
                      setGroupId(id);
                    }}
                  >
                    <VinesIcon size="sm">{info?.iconUrl}</VinesIcon>
                    <div className="flex max-w-44 flex-col gap-0.5">
                      <h1 className="text-sm font-bold leading-tight">
                        {getI18nContent(info?.displayName) ?? t('common.utils.untitled')}
                      </h1>
                      <div className="flex items-center gap-0.5">
                        <VinesLucideIcon className="size-3" size={12} src={EMOJI2LUCIDE_MAPPER[viewIcon] ?? viewIcon} />
                        <span className="text-xxs">
                          {t([`workspace.wrapper.space.tabs.${page.displayName}`, page.displayName])}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
          <Tooltip>
            <TooltipTrigger asChild>
              <Link to="/$teamId/workflows/" params={{ teamId }}>
                <Button icon={<Plus />} className="mt-2 w-full" variant="outline" />
              </Link>
            </TooltipTrigger>
            <TooltipContent>{t('workbench.sidebar.add')}</TooltipContent>
          </Tooltip>
        </div>
      </motion.div>
      <Separator orientation="vertical" className="vines-center">
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className="group z-10 flex h-4 w-3.5 cursor-pointer items-center justify-center rounded-sm border bg-border px-0.5 transition-opacity hover:opacity-75 active:opacity-95"
              onClick={() => setVisible(!visible)}
            >
              <ChevronRight className={cn(visible && 'scale-x-[-1]')} />
            </div>
          </TooltipTrigger>
          <TooltipContent>{visible ? t('common.sidebar.hide') : t('common.sidebar.show')}</TooltipContent>
        </Tooltip>
      </Separator>
    </div>
  );
};
