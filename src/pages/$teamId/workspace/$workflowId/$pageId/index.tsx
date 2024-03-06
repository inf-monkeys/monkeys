import React, { useCallback, useEffect, useState } from 'react';

import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';

import { CircularProgress } from '@nextui-org/progress';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import isMongoId from 'validator/es/lib/isMongoId';
import z from 'zod';

import { IPageType } from '@/apis/pages/typings.ts';
import { useVinesPage } from '@/components/layout-wrapper/workspace/utils.ts';
import { teamIdGuard } from '@/components/router/guard/team-id.ts';
import { usePageStore } from '@/store/usePageStore';
import { cn } from '@/utils';
import VinesEvent from '@/utils/events.ts';
import { useRetimer } from '@/utils/use-retimer.ts';

export const WorkspacePage: React.FC = () => {
  const navigate = useNavigate();
  const reTimer = useRetimer();

  const { workflow, pages, page, pageId, teamId, setApikey, setPage } = useVinesPage();

  const { pageTitle } = usePageStore();

  useEffect(() => {
    if (pages && pageId && teamId) {
      // 二次检查 pageId
      const page = pages.find(({ _id }) => _id === pageId);
      if (page) {
        setPage(page);
        const pageApiKey = page.apiKey;
        if (!pageApiKey) {
          toast.error('页面 API-KEY 获取失败！');
        } else {
          setApikey(pageApiKey);
        }
      } else {
        void navigate({
          to: '/$teamId/workflows',
          params: {
            teamId,
          },
        });
      }
    }
  }, [pageId, pages]);

  useEffect(() => {
    if (!workflow) return;
    const workflowName = workflow.name;
    workflowName && VinesEvent.emit('vines-update-site-title', (pageTitle ? `${pageTitle} - ` : '') + workflowName);
  }, [workflow, pageTitle]);

  const [loading, setLoading] = useState(true);
  const [renderPages, setRenderPages] = useState<IPageType[]>([]);

  useEffect(() => {
    if (!page) return;
    const index = renderPages.findIndex(({ _id }) => _id === page._id);
    if (index === -1) {
      setLoading(true);
      setTimeout(() => setRenderPages((prev) => [...prev, page]), 192);
    }
  }, [page]);

  useEffect(() => {
    setRenderPages((prev) => {
      if (!pages) return prev;
      return prev.filter((it) => pages.find(({ _id }) => _id === it._id));
    });
  }, [pages]);

  const handleToggleLoading = useCallback(
    (status?: boolean, wait = 1000) => {
      reTimer(setTimeout(() => setLoading(status ?? !loading), wait) as unknown as number);
    },
    [reTimer],
  );

  return (
    <AnimatePresence>
      {renderPages.map((it) => (
        <motion.iframe
          key={it._id}
          src={`/${it.teamId}/workspace/${it.workflowId}/vines-${it.type}`}
          variants={{
            enter: {
              opacity: 1,
              display: 'block',
            },
            exit: {
              opacity: 0,
              transitionEnd: {
                display: 'none',
              },
            },
          }}
          animate={it._id === page?._id ? 'enter' : 'exit'}
          className={cn('absolute left-0 top-0 h-full w-full', { hidden: loading })}
          onLoadStart={() => setLoading(true)}
          onLoad={() => handleToggleLoading(false)}
        />
      ))}
      {loading && (
        <motion.div
          key="vines-page-waiting"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.2 } }}
          exit={{ opacity: 0, transition: { duration: 0.2 } }}
          transition={{ type: 'linear' }}
          className="vines-center absolute left-0 top-0 size-full bg-slate-1"
        >
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.38 } }}>
            <CircularProgress className="[&_circle:last-child]:stroke-vines-500" size="lg" aria-label="Loading..." />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const Route = createFileRoute('/$teamId/workspace/$workflowId/$pageId/')({
  component: WorkspacePage,
  beforeLoad: (opts) => {
    const pageId = opts.params.pageId;

    if (!z.string().refine(isMongoId).safeParse(pageId).success) {
      throw redirect({
        to: '/$teamId/workflows',
        params: {
          teamId: opts.params.teamId,
        },
      });
    }

    return teamIdGuard(opts);
  },
  validateSearch: z.object({
    to: z.string().optional(),
  }),
});
