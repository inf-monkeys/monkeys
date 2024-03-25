import { VinesChatView } from 'src/view/vines-chat';
import { VinesLogView } from 'src/view/vines-log';

import { VinesFlow } from '@/components/layout/vines-flow';
import { withProviders } from '@/components/ui/vines-iframe/utils.ts';
import { CanvasStoreProvider, createCanvasStore } from '@/store/useCanvasStore';
import { createFlowStore, FlowStoreProvider } from '@/store/useFlowStore';
import { VinesPreView } from '@/view/vines-preview';

export const IFRAME_MAP = {
  process: withProviders(VinesFlow, [FlowStoreProvider, createFlowStore], [CanvasStoreProvider, createCanvasStore]),
  log: VinesLogView,
  preview: VinesPreView,
  chat: VinesChatView,
};
