import React, { useEffect } from 'react';

import { createFileRoute } from '@tanstack/react-router';

import { Page404 } from '@/components/layout/workspace/404.tsx';
import { useVinesFlowWithPage } from '@/components/layout-wrapper/workspace/utils.ts';
import { teamIdGuard } from '@/components/router/guard/team-id.ts';
import { useVinesFlow } from '@/package/vines-flow/use.ts';

export const VinesProcessPage: React.FC = () => {
  const { workflow } = useVinesFlowWithPage();
  const { vines } = useVinesFlow();

  useEffect(() => {
    workflow && vines.update({ workflow });
  }, [workflow]);

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
