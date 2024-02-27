import React from 'react';

import { createFileRoute } from '@tanstack/react-router';

import { teamIdGuard } from '@/components/router/guard/team-id.ts';

export const ToolStore: React.FC = () => {
  return <>ToolStore</>;
};

export const Route = createFileRoute('/$teamId/tool-store/')({
  component: ToolStore,
  beforeLoad: teamIdGuard,
});
