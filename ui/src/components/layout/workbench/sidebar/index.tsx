import React, { useEffect, useState } from 'react';

import { Link } from '@tanstack/react-router';

import { motion } from 'framer-motion';
import { ChevronRight, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useWorkspacePages } from '@/apis/pages';
import { IPinPage } from '@/apis/pages/typings.ts';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { VinesIcon } from '@/components/ui/vines-icon';
import { cn, useLocalStorage } from '@/utils';
import { useRetimer } from '@/utils/use-retimer.ts';

interface IWorkbenchSidebarProps extends React.ComponentPropsWithoutRef<'div'> {}

export const WorkbenchSidebar: React.FC<IWorkbenchSidebarProps> = () => {
  const { t } = useTranslation();

  const reTimer = useRetimer();
  const { data } = useWorkspacePages();
  const [visible, setVisible] = useState(true);

  const [currentPage, setCurrentPage] = useLocalStorage<Partial<IPinPage>>('vines-ui-workbench-page', data?.[0] ?? {});
  useEffect(() => {
    reTimer(
      setTimeout(() => {
        if (data?.length && !currentPage?.id) {
          setCurrentPage(data[0]);
        }
        if (currentPage?.id && !data?.find((page) => page.id === currentPage.id)) {
          setCurrentPage({});
        }
      }, 180) as unknown as number,
    );
  }, [currentPage, data]);

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
        <h1 className="text-2xl font-bold">{t('components.layout.main.sidebar.list.workbench.label')}</h1>
        <div className="grid gap-2">
          {data?.map((page) => (
            <div
              key={page.id}
              className={cn(
                'flex cursor-pointer items-start space-x-2 rounded-md p-2 transition-colors hover:bg-accent hover:text-accent-foreground',
                currentPage?.id === page.id && 'border border-input bg-background text-accent-foreground',
              )}
              onClick={() => setCurrentPage(page)}
            >
              <VinesIcon size="sm">{page.workflow?.iconUrl}</VinesIcon>
              <div className="flex flex-col gap-0.5">
                <h1 className="font-bold leading-tight">{page.displayName}</h1>
                <span className="text-xxs">{page.workflow?.displayName ?? t('common.utils.untitled')}</span>
              </div>
            </div>
          ))}
          <Tooltip>
            <TooltipTrigger asChild>
              <Link to="/$teamId/workflows">
                <Button icon={<Plus />} className="w-full" variant="outline" />
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
          <TooltipContent>{visible ? t('common.side-bar.hide') : t('common.side-bar.show')}</TooltipContent>
        </Tooltip>
      </Separator>
    </div>
  );
};
