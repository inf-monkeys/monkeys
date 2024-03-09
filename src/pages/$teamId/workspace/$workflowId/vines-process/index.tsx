import { createFileRoute } from '@tanstack/react-router';

import { VinesFlow } from '@/components/layout/vines-flow';
import { teamIdGuard } from '@/components/router/guard/team-id.ts';

export const Route = createFileRoute('/$teamId/workspace/$workflowId/vines-process/')({
  component: VinesFlow,
  beforeLoad: teamIdGuard,
});
