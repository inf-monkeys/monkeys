import React from 'react';

import { createFileRoute } from '@tanstack/react-router';

import { Page404 } from '@/components/layout/workspace/404.tsx';
import { teamIdGuard } from '@/components/router/guard/team-id.ts';

export const MediaData: React.FC = () => {
  return <Page404 title="富媒体数据" />;
};

export const Route = createFileRoute('/$teamId/media-data/')({
  component: MediaData,
  beforeLoad: teamIdGuard,
});
