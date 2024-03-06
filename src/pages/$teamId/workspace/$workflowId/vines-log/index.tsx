import React from 'react';

import { createFileRoute } from '@tanstack/react-router';

import { Page404 } from '@/components/layout/workspace/404.tsx';
import { teamIdGuard } from '@/components/router/guard/team-id.ts';

export const VinesLogPage: React.FC = () => {
  return (
    <>
      <Page404 title="日志视图" />
    </>
  );
};

export const Route = createFileRoute('/$teamId/workspace/$workflowId/vines-log/')({
  component: VinesLogPage,
  beforeLoad: teamIdGuard,
});
