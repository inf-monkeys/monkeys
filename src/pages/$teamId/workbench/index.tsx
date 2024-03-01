import React from 'react';

import { createFileRoute } from '@tanstack/react-router';

import { teamIdGuard } from '@/components/router/guard/team-id.ts';

export const Workbench: React.FC = () => {
  return <>Workbench</>;
};

export const Route = createFileRoute('/$teamId/workbench/')({
  component: Workbench,
  beforeLoad: teamIdGuard,
});
