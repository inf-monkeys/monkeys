import React from 'react';

import { createFileRoute } from '@tanstack/react-router';

import { teamIdGuard } from '@/components/router/guard/team-id.ts';

export const Workflows: React.FC = () => {
  return <>Workflows</>;
};

export const Route = createFileRoute('/$teamId/workflows/')({
  component: Workflows,
  beforeLoad: teamIdGuard,
});
