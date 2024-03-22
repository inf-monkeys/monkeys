import React, { useEffect } from 'react';

import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';

import { toast } from 'sonner';
import isMongoId from 'validator/es/lib/isMongoId';
import z from 'zod';

import { useVinesPage } from '@/components/layout-wrapper/workspace/utils.ts';
import { teamIdGuard } from '@/components/router/guard/team-id.ts';
import { VinesIFrame } from '@/components/ui/vines-iframe';
import { usePageStore } from '@/store/usePageStore';
import VinesEvent from '@/utils/events.ts';

export const WorkspacePage: React.FC = () => {
  const navigate = useNavigate();

  const { workflow, pages, page, pageId, teamId, setApikey, setPage } = useVinesPage();

  const { pageTitle } = usePageStore();

  useEffect(() => {
    if (pages && pageId && teamId) {
      // 二次检查 pageId
      const page = pages.find(({ id }) => id === pageId);
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

  return <VinesIFrame pages={pages ?? []} page={page} />;
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
