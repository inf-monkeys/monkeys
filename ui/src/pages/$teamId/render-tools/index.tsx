import React from 'react';

import { createFileRoute } from '@tanstack/react-router';

import { teamIdGuard } from '@/components/router/guard/team-id.ts';

export const RenderTools: React.FC = () => {
  return <>RenderTools</>;
};

export const Route = createFileRoute('/$teamId/render-tools/')({
  component: RenderTools,
  beforeLoad: teamIdGuard,
});
