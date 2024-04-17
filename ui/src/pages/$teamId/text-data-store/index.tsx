import React from 'react';

import { createFileRoute } from '@tanstack/react-router';

import { Page404 } from '@/components/layout/workspace/404.tsx';
import { teamIdGuard } from '@/components/router/guard/team-id.ts';

export const TextDataStore: React.FC = () => {
  return <Page404 title="文本数据市场" />;
};

export const Route = createFileRoute('/$teamId/text-data-store/')({
  component: TextDataStore,
  beforeLoad: teamIdGuard,
});
