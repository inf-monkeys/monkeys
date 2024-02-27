import React from 'react';

import { createFileRoute } from '@tanstack/react-router';

import { teamIdGuard } from '@/components/router/guard/team-id.ts';

export const ApplicationStore: React.FC = () => {
  return <>ApplicationStore</>;
};

export const Route = createFileRoute('/$teamId/application-store/')({
  component: ApplicationStore,
  beforeLoad: teamIdGuard,
});
