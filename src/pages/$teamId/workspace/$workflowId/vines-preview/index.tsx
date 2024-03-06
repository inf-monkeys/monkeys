import React from 'react';

import { createFileRoute } from '@tanstack/react-router';

import { Page404 } from '@/components/layout/workspace/404.tsx';
import { teamIdGuard } from '@/components/router/guard/team-id.ts';

export const VinesPreviewPage: React.FC = () => {
  return (
    <>
      <Page404 title="预览视图" />
    </>
  );
};

export const Route = createFileRoute('/$teamId/workspace/$workflowId/vines-preview/')({
  component: VinesPreviewPage,
  beforeLoad: teamIdGuard,
});
