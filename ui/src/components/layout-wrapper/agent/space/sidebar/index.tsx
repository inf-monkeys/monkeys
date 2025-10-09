import React from 'react';

import { useTranslation } from 'react-i18next';

import { AgentSpaceTab } from '@/components/layout-wrapper/agent/space/sidebar/tab.tsx';
import { SpaceSidebarTabsList } from '@/components/layout-wrapper/space/sidebar/tabs.tsx';

interface IAgentSpaceSidebarProps extends React.ComponentPropsWithoutRef<'div'> {}

export const AgentSpaceSidebar: React.FC<IAgentSpaceSidebarProps> = () => {
  const { t } = useTranslation();

  return (
    <SpaceSidebarTabsList>
      <AgentSpaceTab value="chat-v2" icon="message-square" displayName={t('agent.space.tab.chat-v2-view')} />
      <AgentSpaceTab value="config" icon="bolt" displayName={t('agent.space.tab.config-view')} />
      <AgentSpaceTab value="logs" icon="square-kanban" displayName={t('agent.space.tab.logs-view')} />
    </SpaceSidebarTabsList>
  );
};
