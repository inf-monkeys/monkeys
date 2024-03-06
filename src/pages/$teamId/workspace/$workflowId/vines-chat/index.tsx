import React from 'react';

import { createFileRoute } from '@tanstack/react-router';

import { Page404 } from '@/components/layout/workspace/404.tsx';
import { teamIdGuard } from '@/components/router/guard/team-id.ts';

export const VinesChatPage: React.FC = () => {
  return (
    <>
      <Page404 title="对话视图" />
    </>
  );
};

export const Route = createFileRoute('/$teamId/workspace/$workflowId/vines-chat/')({
  component: VinesChatPage,
  beforeLoad: teamIdGuard,
});
