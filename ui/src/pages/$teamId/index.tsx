import { createFileRoute } from '@tanstack/react-router';

import { teamIdGuard } from '@/components/router/guard/team-id.ts';
import { Workbench } from '@/pages/$teamId/workbench';

export const Route = createFileRoute('/$teamId/')({
  component: Workbench,
  beforeLoad: teamIdGuard,
});
