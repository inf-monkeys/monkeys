import { createLazyFileRoute } from '@tanstack/react-router';

import { Workbench } from '@/pages/$teamId/workbench/index.lazy.tsx';

export const Route = createLazyFileRoute('/$teamId/')({
  component: Workbench,
});
