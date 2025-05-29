import React, { useEffect } from 'react';

import { preload } from 'swr';
import { createLazyFileRoute, useNavigate, useParams } from '@tanstack/react-router';

import { useDesignProjectMetadataList } from '@/apis/designs';
import { vinesFetcher } from '@/apis/fetcher.ts';
import { useWorkspacePagesWithWorkflowId } from '@/apis/pages';
import { VinesLoading } from '@/components/ui/loading';

export const DesignBoardIndex: React.FC = () => {
  const { to } = Route.useSearch() as { to: string };
  const { designProjectId, teamId } = useParams({ from: '/$teamId/design/$designProjectId/' });
  const { data: boards } = useDesignProjectMetadataList(designProjectId);
  const navigate = useNavigate();

  useEffect(() => {
    if (boards && boards.length > 0) {
      const board = boards[0];
      void navigate({
        to: '/$teamId/design/$designProjectId/$designBoardId',
        params: {
          designProjectId,
          teamId,
          designBoardId: board.id,
        },
        search: {
          to,
        },
      });
    }
  }, [boards]);

  useEffect(() => {
    void preload(`/api/design/project/${designProjectId}`, vinesFetcher());
  }, [designProjectId]);

  return (
    <div className="vines-center size-full">
      <VinesLoading />
    </div>
  );
};

export const Route = createLazyFileRoute('/$teamId/design/$designProjectId/')({
  component: DesignBoardIndex,
});
