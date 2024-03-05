import React, { useEffect } from 'react';

import { createFileRoute, redirect, useNavigate, useParams } from '@tanstack/react-router';

import { toast } from 'sonner';
import isMongoId from 'validator/es/lib/isMongoId';
import z from 'zod';

import { useListWorkspacePages } from '@/apis/pages';
import { teamIdGuard } from '@/components/router/guard/team-id.ts';
import { setLocalStorage } from '@/utils';

export const WorkspacePage: React.FC = () => {
  const { workflowId, pageId, teamId } = useParams({ from: '/$teamId/workspace/$workflowId/$pageId' });
  const { data: pages } = useListWorkspacePages(workflowId);
  const navigate = useNavigate();

  useEffect(() => {
    if (pages && pageId && teamId) {
      // 二次检查 pageId
      const page = pages.find(({ _id }) => _id === pageId);
      if (!page) {
        void navigate({
          to: '/$teamId/workflows',
          params: {
            teamId,
          },
        });
      }
      const pageApiKey = page?.apiKey;
      if (!pageApiKey) {
        toast.error('页面 API-KEY 获取失败！');
      } else {
        setLocalStorage('vines-apikey', pageApiKey);
      }
    }
  }, [pageId, pages]);

  return null;
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
