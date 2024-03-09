import { VinesFlow } from '@/components/layout/vines-flow';
import { withProviders } from '@/components/ui/vines-iframe/utils.ts';
import { VinesChatPage } from '@/pages/$teamId/workspace/$workflowId/vines-chat';
import { VinesLogPage } from '@/pages/$teamId/workspace/$workflowId/vines-log';
import { VinesPreviewPage } from '@/pages/$teamId/workspace/$workflowId/vines-preview';
import { createFlowStore, FlowStoreProvider } from '@/store/useFlowStore';

export const IFRAME_MAP = {
  process: withProviders(VinesFlow, [FlowStoreProvider, createFlowStore]),
  log: VinesLogPage,
  preview: VinesPreviewPage,
  chat: VinesChatPage,
};
