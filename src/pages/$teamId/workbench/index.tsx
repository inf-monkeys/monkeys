import React from 'react';

import { createFileRoute } from '@tanstack/react-router';

import { authGuard } from '@/components/router/guard/auth.ts';

const Workbench: React.FC = () => {
  return <>Workbench</>;
};

export const Route = createFileRoute('/$teamId/workbench/')({
  component: Workbench,
  beforeLoad: authGuard,
});
