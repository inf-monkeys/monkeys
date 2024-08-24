import React, { useState } from 'react';

import { Link } from '@tanstack/react-router';

import { useDebounceEffect, useThrottleEffect } from 'ahooks';
import { AnimatePresence, motion } from 'framer-motion';
import { keyBy, map } from 'lodash';
import { ChevronRight, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useWorkspacePages } from '@/apis/pages';
import { VirtuaWorkbenchViewList } from '@/components/layout/workbench/sidebar/mode/normal/virtua';
import { IWorkbenchViewItemPage } from '@/components/layout/workbench/sidebar/mode/normal/virtua/item.tsx';
import { useVinesTeam } from '@/components/router/guard/team.tsx';
import { Button } from '@/components/ui/button';
import { VinesFullLoading } from '@/components/ui/loading';
import { Separator } from '@/components/ui/separator.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useElementSize } from '@/hooks/use-resize-observer';
import { cn } from '@/utils';

interface IWorkbenchNormalModeSidebarProps extends React.ComponentPropsWithoutRef<'div'> {
  groupId: string;
  setGroupId: React.Dispatch<React.SetStateAction<string>>;
}

export const WorkbenchNormalModeSidebar: React.FC<IWorkbenchNormalModeSidebarProps> = ({ groupId, setGroupId }) => {
  const { t } = useTranslation();

  const { teamId } = useVinesTeam();

  const { data, isLoading } = useWorkspacePages();
  const [visible, setVisible] = useState(true);

  const originalPages = data?.pages ?? [];
  const originalGroups = data?.groups ?? [];

  const pagesMap = keyBy(originalPages, 'id');
  const lists = map(originalGroups, ({ pageIds, ...attr }) => ({
    ...attr,
    pages: map(pageIds, (pageId) => pagesMap[pageId]).filter(Boolean),
  }))
    .filter((it) => it.pages?.length)
    .toSorted((a) => (a.isBuiltIn ? -1 : 1));

  const [currentPage, setCurrentPage] = useLocalStorage<Partial<IWorkbenchViewItemPage>>('vines-ui-workbench-page', {});

  useDebounceEffect(
    () => {
      const pagesLength = originalPages.length;
      const groupsLength = originalGroups.length;
      if (!pagesLength) return;

      const currentPageId = currentPage?.id;

      const setEmptyOrFirstPage = () => {
        if (pagesLength && groupsLength) {
          originalGroups
            .toSorted((a) => (a.isBuiltIn ? 1 : -1))
            .forEach(({ id, pageIds }) => {
              if (pageIds.length) {
                const firstPage = originalPages.find((it) => it.id === pageIds[0]);
                if (firstPage) {
                  setCurrentPage(firstPage);
                  setGroupId(id);
                  return;
                }
              }
            });
          return;
        }

        setCurrentPage({});
      };

      if (currentPageId) {
        const page = originalPages.find((it) => it.id === currentPageId);
        if (!page) {
          setEmptyOrFirstPage();
        } else {
          const groupIdWithPage = originalGroups.find((it) => it.id === currentPage?.groupId ?? currentPageId);
          if (groupIdWithPage) {
            setGroupId(groupIdWithPage.id);
          } else {
            setEmptyOrFirstPage();
          }
        }
      } else {
        setEmptyOrFirstPage();
      }
    },
    [currentPage, data],
    { wait: 180 },
  );

  const { ref, height: wrapperHeight } = useElementSize();
  const [height, setHeight] = useState(500);
  useThrottleEffect(
    () => {
      if (!wrapperHeight) return;
      setHeight(wrapperHeight - 74);
    },
    [wrapperHeight],
    { wait: 64 },
  );

  return (
    <div className="relative flex h-full" ref={ref}>
      <AnimatePresence>{isLoading && <VinesFullLoading disableCard />}</AnimatePresence>
      <motion.div
        className="flex flex-col gap-4 overflow-hidden [&_h1]:line-clamp-1 [&_span]:line-clamp-1"
        initial={{ width: 280, paddingRight: 16 }}
        animate={{
          width: visible ? 280 : 0,
          paddingRight: visible ? 16 : 0,
          transition: { duration: 0.2 },
        }}
      >
        <div className="grid p-4 pr-0">
          <VirtuaWorkbenchViewList
            height={height}
            data={lists}
            currentPageId={currentPage?.id}
            currentGroupId={groupId}
            onChildClick={(page) => {
              setCurrentPage(page);
              setGroupId(page.groupId);
            }}
          />
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
      <div className="group z-10 -mr-4 h-full w-4">
        <Separator
          orientation="vertical"
          className={cn(
            'vines-center before:absolute before:z-20 before:h-full before:w-1 before:cursor-pointer before:transition-all before:hover:bg-border',
            !visible && 'bg-transparent',
          )}
          onClick={() => setVisible(!visible)}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="-mr-4 flex h-6 w-4 cursor-pointer items-center justify-center rounded-r-sm border bg-border px-0.5 opacity-0 transition-opacity hover:opacity-75 active:opacity-95 group-hover:opacity-100">
                <ChevronRight className={cn('size-3', visible && 'scale-x-[-1]')} />
              </div>
            </TooltipTrigger>
            <TooltipContent>{visible ? t('common.sidebar.hide') : t('common.sidebar.show')}</TooltipContent>
          </Tooltip>
        </Separator>
      </div>
    </div>
  );
};
