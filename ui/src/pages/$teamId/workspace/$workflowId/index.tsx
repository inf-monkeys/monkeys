import React, { useEffect } from 'react';

import { preload } from 'swr';
import { createFileRoute, redirect, useNavigate, useParams } from '@tanstack/react-router';

import z from 'zod';

import { vinesFetcher } from '@/apis/fetcher.ts';
import { useWorkspacePagesWithWorkflowId } from '@/apis/pages';
import { teamIdGuard } from '@/components/router/guard/team-id.ts';
import { VinesLoading } from '@/components/ui/loading';

export const WorkspaceIndex: React.FC = () => {
  const { to } = Route.useSearch();
  const { workflowId } = useParams({ from: '/$teamId/workspace/$workflowId' });
  const { data: pages } = useWorkspacePagesWithWorkflowId(workflowId);
  const navigate = useNavigate();

  useEffect(() => {
    if (pages) {
      const page = pages.find(({ type }) => type === to) ?? pages[0];
      void navigate({
        to: '/$teamId/workspace/$workflowId/$pageId',
        params: {
          pageId: page.id,
        },
        search: {
          to,
        },
      });
    }
  }, [pages]);

  useEffect(() => {
    void preload(`/api/workflow/metadata/${workflowId}`, vinesFetcher());
  }, [workflowId]);

  return (
    <div className="vines-center size-full">
      <VinesLoading />
    </div>
  );
};

export const Route = createFileRoute('/$teamId/workspace/$workflowId/')({
  component: WorkspaceIndex,
  beforeLoad: (opts) => {
    const workflowId = opts.params.workflowId;

    if (!z.string().safeParse(workflowId).success) {
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
