import React from 'react';

import { createFileRoute } from '@tanstack/react-router';

import { teamIdGuard } from '@/components/router/guard/team-id.ts';

export const ImageModels: React.FC = () => {
  return <>ImageModels</>;
};

export const Route = createFileRoute('/$teamId/image-models/')({
  component: ImageModels,
  beforeLoad: teamIdGuard,
});
