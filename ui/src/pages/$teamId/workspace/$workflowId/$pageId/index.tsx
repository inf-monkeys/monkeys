import React, { useEffect } from 'react';

import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';

import { useTranslation } from 'react-i18next';
import z from 'zod';

import { useVinesPage } from '@/components/layout-wrapper/workspace/utils.ts';
import { teamIdGuard } from '@/components/router/guard/team-id.ts';
import { VinesIFrame } from '@/components/ui/vines-iframe';
import { usePageStore } from '@/store/usePageStore';
import { getI18nContent } from '@/utils';
import VinesEvent from '@/utils/events.ts';

export const WorkspacePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { workflow, pages, page, pageId, teamId, setPage } = useVinesPage();

  const { pageTitle } = usePageStore();

  useEffect(() => {
    if (pages && pageId && teamId) {
      // 二次检查 pageId
      const page = pages.find(({ id }) => id === pageId);
      if (page) {
        setPage(page);
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
    const workflowName = getI18nContent(workflow.displayName);
    workflowName &&
      VinesEvent.emit(
        'vines-update-site-title',
        (pageTitle ? `${t([`workspace.wrapper.space.tabs.${pageTitle}`, pageTitle])} - ` : '') + workflowName,
      );
  }, [workflow, pageTitle]);

  return <VinesIFrame pages={pages ?? []} page={page} />;
};

export const Route = createFileRoute('/$teamId/workspace/$workflowId/$pageId/')({
  component: WorkspacePage,
  beforeLoad: (opts) => {
    const pageId = opts.params.pageId;

    if (!z.string().safeParse(pageId).success) {
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
