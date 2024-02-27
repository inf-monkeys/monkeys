import React from 'react';

import { createFileRoute } from '@tanstack/react-router';

import { teamIdGuard } from '@/components/router/guard/team-id.ts';

export const TextData: React.FC = () => {
  return <>TextData</>;
};

export const Route = createFileRoute('/$teamId/text-data/')({
  component: TextData,
  beforeLoad: teamIdGuard,
});
