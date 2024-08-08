import { VinesChatView } from 'src/view/vines-chat';
import { VinesLogView } from 'src/view/vines-log';

import { withProviders } from '@/components/ui/vines-iframe/utils.ts';
import { CanvasInteractionStoreProvider, createCanvasInteractionStore } from '@/store/useCanvasStore/interaction.ts';
import { AgentChatView } from '@/view/agent-chat';
import { AgentConfigView } from '@/view/agent-config';
import { AgentLogsView } from 'src/view/agent-logs';
import { VinesFlow } from '@/view/vines-flow';
import { VinesForm } from '@/view/vines-form';

export const IFRAME_MAP = {
  process: withProviders(VinesFlow, [CanvasInteractionStoreProvider, createCanvasInteractionStore]),
  log: VinesLogView,
  preview: VinesForm,
  chat: VinesChatView,
  'agent-chat': AgentChatView,
  'agent-config': AgentConfigView,
  'agent-logs': AgentLogsView,
};

export const VINES_VIEW_ID_MAPPER: Record<string, string> = {
  'view-flow': 'process',
  'view-logs': 'log',
  'view-form': 'preview',
  'view-chat': 'chat',
};

export const VINES_IFRAME_PAGE_IDS = Object.keys(VINES_VIEW_ID_MAPPER).concat(Object.values(VINES_VIEW_ID_MAPPER));

export const VINES_IFRAME_PAGE_TYPES = Object.keys(IFRAME_MAP);

export const VINEs_IFRAME_PAGE_TYPE2ID_MAPPER = Object.entries(VINES_VIEW_ID_MAPPER).reduce(
  (acc, [key, value]) => {
    acc[value] = key;
    return acc;
  },
  {} as Record<string, string>,
);
