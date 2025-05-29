import React from 'react';

import { useNavigate, useParams } from '@tanstack/react-router';

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

interface IDesignSpaceTabProps {
  value: string;
  displayName: string;
}

export const DesignSpaceTab: React.FC<IDesignSpaceTabProps> = ({ value, displayName }) => {
  const { teamId, designProjectId, designBoardId } = useParams({
    from: '/$teamId/design/$designProjectId/$designBoardId/',
  });

  const navigate = useNavigate();

  const active = designBoardId === value;

  return (
    <div
      className={spaceSidebarTabVariants(active ? { status: 'active' } : {})}
      onClick={() => {
        void navigate({
          to: '/$teamId/design/$designProjectId/$designBoardId/',
          params: {
            teamId,
            designProjectId,
            designBoardId: value,
          },
        });
      }}
    >
      <SpaceSidebarTabContent icon={'pencil-ruler'} displayName={displayName}>
        <AnimatePresence>
          {active && (
            <motion.div
              key={value + '_more_button'}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
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
                    <ViewGroup pageId={`design-board-${value}`} />
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
