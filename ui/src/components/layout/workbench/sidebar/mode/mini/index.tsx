import React, { useState } from 'react';

import { Link } from '@tanstack/react-router';

import { useDebounceEffect, useThrottleEffect } from 'ahooks';
import { motion } from 'framer-motion';
import { ChevronLeft, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Virtuoso } from 'react-virtuoso';

import { useWorkspacePages } from '@/apis/pages';
import { IPinPage } from '@/apis/pages/typings.ts';
import { EMOJI2LUCIDE_MAPPER } from '@/components/layout-wrapper/workspace/space/sidebar/tabs/tab';
import { useVinesTeam } from '@/components/router/guard/team.tsx';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { VinesIcon } from '@/components/ui/vines-icon';
import { VinesLucideIcon } from '@/components/ui/vines-icon/lucide';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useElementSize } from '@/hooks/use-resize-observer';
import { cn, getI18nContent } from '@/utils';

interface IWorkbenchMiniModeSidebarProps extends React.ComponentPropsWithoutRef<'div'> {
  mode?: 'normal' | 'fast' | 'mini';
}

export const WorkbenchMiniModeSidebar: React.FC<IWorkbenchMiniModeSidebarProps> = ({ mode = 'mini' }) => {
  const { t } = useTranslation();

  const { teamId } = useVinesTeam();

  const { data } = useWorkspacePages();
  const [visible, setVisible] = useState(true);

  const originalPages = data?.pages.filter(({ type }) => type === 'preview') ?? [];

  const [currentPage, setCurrentPage] = useLocalStorage<Partial<IPinPage>>('vines-ui-workbench-page', {});

  useDebounceEffect(
    () => {
      const currentPageId = currentPage?.id;

      if (currentPageId) {
        if (!originalPages?.find((page) => page.id === currentPageId)) {
          setCurrentPage({});
        }
      }
    },
    [originalPages],
    { wait: 180 },
  );

  const { ref, height: wrapperHeight } = useElementSize();
  const [height, setHeight] = useState(500);
  useThrottleEffect(
    () => {
      if (!wrapperHeight) return;
      setHeight(wrapperHeight - 96);
    },
    [wrapperHeight],
    { wait: 64 },
  );

  return (
    <div className="flex h-full max-w-64" ref={ref}>
      <motion.div
        className="flex flex-col gap-4 overflow-hidden [&_h1]:line-clamp-1 [&_span]:line-clamp-1"
        initial={{ width: 256, paddingRight: 16 }}
        animate={{
          width: visible ? 256 : 0,
          paddingRight: visible ? 16 : 0,
          transition: { duration: 0.2 },
        }}
      >
        {mode === 'normal' && (
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
        )}
        <div className="grid">
          <Virtuoso
            style={{ height }}
            data={originalPages}
            itemContent={(_, page) => {
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
                    currentPage?.id === pageId
                      ? 'border border-input bg-background p-2 text-accent-foreground'
                      : 'p-[calc(0.5rem+1px)]',
                  )}
                  onClick={() => {
                    setCurrentPage(page);
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
                        {t([`workspace.wrapper.space.tabs.${page?.displayName ?? ''}`, page?.displayName ?? ''])}
                      </span>
                    </div>
                  </div>
                </div>
              );
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
      <Separator orientation="vertical" className="vines-center" />
    </div>
  );
};
