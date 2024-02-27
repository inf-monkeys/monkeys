import React from 'react';

import { createFileRoute } from '@tanstack/react-router';

import { teamIdGuard } from '@/components/router/guard/team-id.ts';

export const TableData: React.FC = () => {
  return <>TableData</>;
};

export const Route = createFileRoute('/$teamId/table-data/')({
  component: TableData,
  beforeLoad: teamIdGuard,
});
