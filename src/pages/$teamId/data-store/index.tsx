import React from 'react';

import { createFileRoute } from '@tanstack/react-router';

import { teamIdGuard } from '@/components/router/guard/team-id.ts';

export const DataStore: React.FC = () => {
  return <>DataStore</>;
};

export const Route = createFileRoute('/$teamId/data-store/')({
  component: DataStore,
  beforeLoad: teamIdGuard,
});
