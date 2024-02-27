import React from 'react';

import { createFileRoute } from '@tanstack/react-router';

import { teamIdGuard } from '@/components/router/guard/team-id.ts';

export const TextModels: React.FC = () => {
  return <>TextModels</>;
};

export const Route = createFileRoute('/$teamId/text-models/')({
  component: TextModels,
  beforeLoad: teamIdGuard,
});
