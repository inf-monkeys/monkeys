import React from 'react';

import { createFileRoute } from '@tanstack/react-router';

import { teamIdGuard } from '@/components/router/guard/team-id.ts';

export const ModelStore: React.FC = () => {
  return <>ModelStore</>;
};

export const Route = createFileRoute('/$teamId/model-store/')({
  component: ModelStore,
  beforeLoad: teamIdGuard,
});
