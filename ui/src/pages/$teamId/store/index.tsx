import { createFileRoute } from '@tanstack/react-router';

import { teamIdGuard } from '@/components/router/guard/team-id.ts';
import { ApplicationStore } from '@/pages/$teamId/application-store';

export const Route = createFileRoute('/$teamId/store/')({
  component: ApplicationStore,
  beforeLoad: teamIdGuard,
});
