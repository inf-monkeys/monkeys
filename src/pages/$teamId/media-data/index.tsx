import React from 'react';

import { createFileRoute } from '@tanstack/react-router';

import { teamIdGuard } from '@/components/router/guard/team-id.ts';

export const MediaData: React.FC = () => {
  return <>MediaData</>;
};

export const Route = createFileRoute('/$teamId/media-data/')({
  component: MediaData,
  beforeLoad: teamIdGuard,
});
