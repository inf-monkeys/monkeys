import React from 'react';

import { createFileRoute } from '@tanstack/react-router';

import { teamIdGuard } from '@/components/router/guard/team-id.ts';

export const Canvas: React.FC = () => {
  return <>Canvas</>;
};

export const Route = createFileRoute('/$teamId/canvas/')({
  component: Canvas,
  beforeLoad: teamIdGuard,
});
