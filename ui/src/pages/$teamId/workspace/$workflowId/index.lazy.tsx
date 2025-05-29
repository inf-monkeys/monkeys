import React, { useEffect } from 'react';

import { preload } from 'swr';
import { createLazyFileRoute, useNavigate, useParams } from '@tanstack/react-router';

import { vinesFetcher } from '@/apis/fetcher.ts';
import { useWorkspacePagesWithWorkflowId } from '@/apis/pages';
import { VinesLoading } from '@/components/ui/loading';

export const WorkspaceIndex: React.FC = () => {
  const { to } = Route.useSearch() as { to: string };
  const { workflowId, teamId } = useParams({ from: '/$teamId/workspace/$workflowId/' });
  const { data: pages } = useWorkspacePagesWithWorkflowId(workflowId);
  const navigate = useNavigate();

  useEffect(() => {
    if (pages) {
      const page = pages.find(({ type }) => type === to) ?? pages[0];
      void navigate({
        to: '/$teamId/workspace/$workflowId/$pageId',
        params: {
          pageId: page.id,
          teamId: teamId,
          workflowId: workflowId,
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

export const Route = createLazyFileRoute('/$teamId/workspace/$workflowId/')({
  component: WorkspaceIndex,
});
