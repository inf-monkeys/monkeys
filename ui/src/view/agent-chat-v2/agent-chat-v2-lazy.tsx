import { lazy } from 'react';

export const VinesAgentChatV2ViewLazy = lazy(() => import('.').then((m) => ({ default: m.AgentChatV2View })));
