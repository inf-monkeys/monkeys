import { createLazyFileRoute } from '@tanstack/react-router';

import { ApplicationStore } from '@/pages/$teamId/application-store/index.lazy.tsx';

export const Route = createLazyFileRoute('/$teamId/store/')({
  component: ApplicationStore,
});
