import React from 'react';

import { VinesLogo } from '@/components/layout/main/vines-logo.tsx';
import { WorkflowInfoCard } from '@/components/layout-wrapper/workspace/header/workflow-info-card.tsx';
import { Separator } from '@/components/ui/separator.tsx';

interface IWorkspaceHeaderProps extends React.ComponentPropsWithoutRef<'header'> {}

export const WorkspaceHeader: React.FC<IWorkspaceHeaderProps> = () => {
  return (
    <header className="flex h-14 w-full items-center justify-between bg-slate-1 px-6 shadow">
      <div className="flex h-full items-center gap-5">
        <VinesLogo description="" height={32} />
        <Separator orientation="vertical" className="h-1/2" />
        <WorkflowInfoCard />
      </div>
    </header>
  );
};
