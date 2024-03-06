import React from 'react';

import { createFileRoute } from '@tanstack/react-router';

import { Page404 } from '@/components/layout/workspace/404.tsx';
import { teamIdGuard } from '@/components/router/guard/team-id.ts';

export const VinesProcessPage: React.FC = () => {
  return (
    <>
      <Page404 title="流程视图" />
    </>
  );
};

export const Route = createFileRoute('/$teamId/workspace/$workflowId/vines-process/')({
  component: VinesProcessPage,
  beforeLoad: teamIdGuard,
});
