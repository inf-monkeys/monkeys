import React from 'react';

import { createFileRoute, useParams } from '@tanstack/react-router';

import { teamIdGuard } from '@/components/router/guard/team-id.ts';

const AgentPage: React.FC = () => {
  const { agentId } = useParams({ from: '/$teamId/agent/$agentId/' });

  return <>{agentId}</>;
};

export const Route = createFileRoute('/$teamId/agent/$agentId/')({
  component: AgentPage,
  beforeLoad: teamIdGuard,
});
