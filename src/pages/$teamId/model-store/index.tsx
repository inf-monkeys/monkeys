import React from 'react';

import { createFileRoute } from '@tanstack/react-router';

import { Page404 } from '@/components/layout/workspace/404.tsx';
import { teamIdGuard } from '@/components/router/guard/team-id.ts';

export const ModelStore: React.FC = () => {
  return <Page404 title="模型市场" />;
};

export const Route = createFileRoute('/$teamId/model-store/')({
  component: ModelStore,
  beforeLoad: teamIdGuard,
});
