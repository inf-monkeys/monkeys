import { VinesChatView } from 'src/view/vines-chat';
import { VinesLogView } from 'src/view/vines-log';

import { withProviders } from '@/components/ui/vines-iframe/utils.ts';
import { CanvasStoreProvider, createCanvasStore } from '@/store/useCanvasStore';
import { CanvasInteractionStoreProvider, createCanvasInteractionStore } from '@/store/useCanvasStore/interaction.ts';
import { VinesFlow } from '@/view/vines-flow';
import { VinesPreView } from '@/view/vines-preview';

export const IFRAME_MAP = {
  process: withProviders(
    VinesFlow,
    [CanvasStoreProvider, createCanvasStore],
    [CanvasInteractionStoreProvider, createCanvasInteractionStore],
  ),
  log: VinesLogView,
  preview: VinesPreView,
  chat: VinesChatView,
};
