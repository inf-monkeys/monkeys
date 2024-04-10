import React from 'react';

import { createFileRoute } from '@tanstack/react-router';

import { Page404 } from '@/components/layout/workspace/404.tsx';
import { teamIdGuard } from '@/components/router/guard/team-id.ts';

export const ToolStore: React.FC = () => {
  return <Page404 title="工具市场" />;
};

export const Route = createFileRoute('/$teamId/tool-store/')({
  component: ToolStore,
  beforeLoad: teamIdGuard,
});
