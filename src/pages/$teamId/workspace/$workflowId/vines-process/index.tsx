import { createFileRoute } from '@tanstack/react-router';

import { VinesFlow } from '@/components/layout/vines-flow';
import { teamIdGuard } from '@/components/router/guard/team-id.ts';
import { createFlowStore, FlowStoreProvider } from '@/store/useFlowStore';

export const Route = createFileRoute('/$teamId/workspace/$workflowId/vines-process/')({
  component: () => (
    <FlowStoreProvider createStore={createFlowStore}>
      <VinesFlow />
    </FlowStoreProvider>
  ),
  beforeLoad: teamIdGuard,
});
