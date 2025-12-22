import { VinesChatView } from 'src/view/vines-chat';
import { VinesLogView } from 'src/view/vines-log';

import { withProviders } from '@/components/ui/vines-iframe/utils.ts';
import { AgentChat, AgentConfig } from '@/features/agent';
import { CanvasInteractionStoreProvider, createCanvasInteractionStore } from '@/store/useCanvasStore/interaction.ts';
import { DesignBoardView } from '@/view/design-board';
import { GlobalDesignBoardView } from '@/view/global-design-board';
import { IframeWrapper } from '@/view/iframe-wrapper';
import { VinesFlow } from '@/view/vines-flow';
import { VinesForm } from '@/view/vines-form';

export const IFRAME_MAP = {
  process: withProviders(VinesFlow, [CanvasInteractionStoreProvider, createCanvasInteractionStore]),
  log: VinesLogView,
  preview: VinesForm,
  chat: VinesChatView,
  'agent-chat-v2': AgentChat,
  'agent-config': AgentConfig,
  'agentv2-chat': AgentChat,
  'agentv2-config': AgentConfig,
  'design-board': DesignBoardView,
  'global-design-board': GlobalDesignBoardView,
  iframe: IframeWrapper,
};

export const VINES_VIEW_ID_MAPPER: Record<string, string> = {
  'view-flow': 'process',
  'view-logs': 'log',
  'view-form': 'preview',
  'view-chat': 'chat',
};

export const VINES_IFRAME_PAGE_IDS = Object.keys(VINES_VIEW_ID_MAPPER).concat(Object.values(VINES_VIEW_ID_MAPPER));

export const VINES_IFRAME_PAGE_TYPES = Object.keys(IFRAME_MAP);

export const VINES_IFRAME_PAGE_TYPE2ID_MAPPER = Object.entries(VINES_VIEW_ID_MAPPER).reduce(
  (acc, [key, value]) => {
    acc[value] = key;
    return acc;
  },
  {} as Record<string, string>,
);
