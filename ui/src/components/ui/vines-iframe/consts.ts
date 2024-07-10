import { VinesChatView } from 'src/view/vines-chat';
import { VinesLogView } from 'src/view/vines-log';

import { withProviders } from '@/components/ui/vines-iframe/utils.ts';
import { CanvasInteractionStoreProvider, createCanvasInteractionStore } from '@/store/useCanvasStore/interaction.ts';
import { VinesFlow } from '@/view/vines-flow';
import { VinesPreView } from '@/view/vines-preview';

export const IFRAME_MAP = {
  process: withProviders(VinesFlow, [CanvasInteractionStoreProvider, createCanvasInteractionStore]),
  log: VinesLogView,
  preview: VinesPreView,
  chat: VinesChatView,
};

export const VINES_VIEW_ID_MAPPER: Record<string, string> = {
  'view-flow': 'process',
  'view-logs': 'log',
  'view-form': 'preview',
  'view-chat': 'chat',
};

export const VINES_IFRAME_PAGE_IDS = Object.keys(VINES_VIEW_ID_MAPPER).concat(Object.values(VINES_VIEW_ID_MAPPER));
