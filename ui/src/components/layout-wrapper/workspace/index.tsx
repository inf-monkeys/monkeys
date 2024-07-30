import React from 'react';

import { Outlet } from '@tanstack/react-router';

import { VinesSpace } from '@/components/layout-wrapper/space';
import { SpaceHeader } from '@/components/layout-wrapper/space/header';
import { SpaceSidebar } from '@/components/layout-wrapper/space/sidebar';
import { ViewGuard } from '@/components/layout-wrapper/view-guard.tsx';
import { WorkflowInfoCard } from '@/components/layout-wrapper/workspace/header/workflow-info-card.tsx';
import { FullScreenDisplay } from '@/components/layout-wrapper/workspace/space/full-screen-display.tsx';
import { Footer } from '@/components/layout-wrapper/workspace/space/sidebar/footer';
import { SpaceTabs } from '@/components/layout-wrapper/workspace/space/sidebar/tabs';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';

export const WorkspaceWrapper: React.FC = () => {
  return (
    <ViewGuard className="bg-slate-3">
      <SpaceHeader>
        <WorkflowInfoCard />
      </SpaceHeader>
      <VinesSpace
        sidebar={
          <SpaceSidebar>
            <ScrollArea className="h-full flex-1 overflow-y-scroll" scrollBarDisabled>
              <SpaceTabs />
            </ScrollArea>
            <Footer />
          </SpaceSidebar>
        }
      >
        <FullScreenDisplay />
        <Outlet />
      </VinesSpace>
    </ViewGuard>
  );
};
