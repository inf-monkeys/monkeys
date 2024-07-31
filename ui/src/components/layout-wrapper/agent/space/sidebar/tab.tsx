import React from 'react';

import { SpaceSidebarTabContent, spaceSidebarTabVariants } from '@/components/layout-wrapper/space/sidebar/tabs.tsx';
import useUrlState from '@/hooks/use-url-state.ts';

interface IAgentSpaceTabProps {
  value: string;
  icon: string;
  displayName: string;
}

export const AgentSpaceTab: React.FC<IAgentSpaceTabProps> = ({ value, icon, displayName }) => {
  const [state, setState] = useUrlState({ tab: 'chat' });

  return (
    <div
      className={spaceSidebarTabVariants(state.tab === value ? { status: 'active' } : {})}
      onClick={() => setState({ tab: value })}
    >
      <SpaceSidebarTabContent icon={icon} displayName={displayName}></SpaceSidebarTabContent>
    </div>
  );
};
