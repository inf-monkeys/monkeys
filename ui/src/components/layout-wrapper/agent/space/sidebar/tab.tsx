import React from 'react';

import { useParams } from '@tanstack/react-router';

import { AnimatePresence, motion } from 'framer-motion';
import { MoreVertical } from 'lucide-react';

import { SpaceSidebarTabContent, spaceSidebarTabVariants } from '@/components/layout-wrapper/space/sidebar/tabs.tsx';
import { ViewGroup } from '@/components/layout-wrapper/workspace/space/sidebar/tabs/menu/group';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.tsx';
import useUrlState from '@/hooks/use-url-state.ts';

interface IAgentSpaceTabProps {
  value: string;
  icon: string;
  displayName: string;
}

export const AgentSpaceTab: React.FC<IAgentSpaceTabProps> = ({ value, icon, displayName }) => {
  const [state, setState] = useUrlState({ tab: 'chat' });

  const { agentId } = useParams({ from: '/$teamId/agent/$agentId/' });

  const active = state.tab === value;

  return (
    <div
      className={spaceSidebarTabVariants(active ? { status: 'active' } : {})}
      onClick={() => setState({ tab: value })}
    >
      <SpaceSidebarTabContent icon={icon} displayName={displayName}>
        <AnimatePresence>
          {active && (
            <motion.div
              key={value + '_more_button'}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute right-2"
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    className="-m-1 scale-[.8] p-1 [&_svg]:stroke-gold-12"
                    icon={<MoreVertical />}
                    variant="borderless"
                  />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" alignOffset={-6} side="right" sideOffset={12}>
                  <DropdownMenuGroup>
                    <ViewGroup pageId={`agent-${agentId}-${value}`} />
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </motion.div>
          )}
        </AnimatePresence>
      </SpaceSidebarTabContent>
    </div>
  );
};
