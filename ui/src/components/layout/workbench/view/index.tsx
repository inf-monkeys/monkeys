import React, { useEffect, useState } from 'react';

import { useThrottleEffect } from 'ahooks';
import { AnimatePresence, motion } from 'framer-motion';
import { GitBranchPlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useWorkspacePages } from '@/apis/pages';
import { IPinPage } from '@/apis/pages/typings.ts';
import { useVinesTeam } from '@/components/router/guard/team.tsx';
import { VinesLoading } from '@/components/ui/loading';
import { VinesIFrame } from '@/components/ui/vines-iframe';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useElementSize } from '@/hooks/use-resize-observer.ts';
import { usePageStore } from '@/store/usePageStore';
import { cn } from '@/utils';

interface IWorkbenchViewProps extends React.ComponentPropsWithoutRef<'div'> {
  mode?: 'normal' | 'fast' | 'mini';
}

export const WorkbenchView: React.FC<IWorkbenchViewProps> = ({ mode }) => {
  const { t } = useTranslation();

  const { data, isLoading } = useWorkspacePages();
  const [pages, setPages] = useState(data?.pages);

  useEffect(() => {
    if (typeof data !== 'undefined') {
      setPages(data?.pages ?? []);
    }
  }, [data?.pages]);

  const { ref, width, height } = useElementSize();

  const { teamId } = useVinesTeam();
  const [page] = useLocalStorage<Partial<IPinPage>>('vines-ui-workbench-page', {});

  const hasPages = (pages?.length ?? 0) > 0;

  const teamPage = page?.[teamId] ?? {};
  const hasPage = !!(teamPage?.id && teamPage?.type);

  const setContainerWidth = usePageStore((s) => s.setContainerWidth);
  const setContainerHeight = usePageStore((s) => s.setContainerHeight);

  useThrottleEffect(
    () => {
      setContainerWidth(width);
      if (height) {
        setContainerHeight(height - (mode === 'mini' ? 16 : 0));
      }
    },
    [width, height, mode],
    { wait: 64 },
  );

  const setPage = usePageStore((s) => s.setPage);
  useEffect(() => {
    if (teamPage?.id && teamPage?.customOptions) {
      setPage({ id: teamPage.id, customOptions: teamPage.customOptions } as any);
    }
  }, [teamPage]);

  return (
    <div
      ref={ref}
      className={cn(
        'relative w-full flex-1 overflow-hidden rounded-r-xl border-b border-r border-t border-input bg-slate-1 p-0 shadow-sm',
        mode === 'mini' && 'rounded-none',
      )}
    >
      <AnimatePresence>
        {hasPages && hasPage ? (
          <motion.div
            key="vines-workbench-view"
            className="absolute top-0 size-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {/*{mode !== 'mini' && <WorkbenchViewHeader page={teamPage} groupId={groupId} />}*/}
            <div className={cn('relative size-full overflow-hidden', mode === 'mini' && 'm-2 size-[calc(100%-1rem)]')}>
              <VinesIFrame pages={pages ?? []} page={teamPage} />
            </div>
          </motion.div>
        ) : isLoading ? (
          <VinesLoading className="vines-center size-full" />
        ) : (
          <motion.div
            key="vines-workbench-view-empty"
            className="vines-center absolute top-0 size-full flex-col gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 1 } }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <GitBranchPlus size={64} />
            <div className="flex flex-col text-center">
              <h2 className="font-bold">{t('workbench.view.no-starred-view')}</h2>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
