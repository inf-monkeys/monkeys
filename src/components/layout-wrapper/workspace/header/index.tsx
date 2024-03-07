import React from 'react';

import { useNavigate, useParams } from '@tanstack/react-router';

import { VinesLogo } from '@/components/layout/main/vines-logo.tsx';
import { UserCard } from '@/components/layout-wrapper/workspace/header/expand/user-card.tsx';
import { WorkflowInfoCard } from '@/components/layout-wrapper/workspace/header/workflow-info-card.tsx';
import { Separator } from '@/components/ui/separator.tsx';
import { Route } from '@/pages/$teamId/workspace/$workflowId/$pageId';

interface IWorkspaceHeaderProps extends React.ComponentPropsWithoutRef<'header'> {}

export const WorkspaceHeader: React.FC<IWorkspaceHeaderProps> = () => {
  const { teamId } = useParams({ from: '/$teamId/workspace/$workflowId/$pageId' });
  const navigate = useNavigate({ from: Route.fullPath });

  return (
    <header className="flex h-14 w-full items-center justify-between bg-slate-1 px-6 shadow">
      <div className="flex h-full items-center gap-5">
        <VinesLogo
          description=""
          height={32}
          className="cursor-pointer"
          onClick={() => navigate({ to: '/$teamId', params: { teamId } })}
        />
        <Separator orientation="vertical" className="h-1/2" />
        <WorkflowInfoCard />
      </div>
      <div className="flex items-center gap-6">
        <UserCard />
      </div>
    </header>
  );
};
