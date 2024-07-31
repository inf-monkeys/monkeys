import React from 'react';

import { createFileRoute, useParams } from '@tanstack/react-router';

import { teamIdGuard } from '@/components/router/guard/team-id.ts';
import { VinesView } from '@/components/ui/vines-iframe/view';
import useUrlState from '@/hooks/use-url-state.ts';
import { createViewStore, ViewStoreProvider } from '@/store/useViewStore';

const AgentPage: React.FC = () => {
  const { agentId } = useParams({ from: '/$teamId/agent/$agentId/' });

  const [{ tab }] = useUrlState({ tab: 'chat' });

  const pageId = `agent-${agentId}-${tab}`;

  return (
    <ViewStoreProvider createStore={createViewStore}>
      <VinesView id={pageId} agentId={agentId} pageId={pageId} type={`agent-${tab}`} />
    </ViewStoreProvider>
  );
};

export const Route = createFileRoute('/$teamId/agent/$agentId/')({
  component: AgentPage,
  beforeLoad: teamIdGuard,
});
