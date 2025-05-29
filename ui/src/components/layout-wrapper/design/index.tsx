import React from 'react';

import { Outlet } from '@tanstack/react-router';

import { VinesDarkMode } from '@/components/layout/main/vines-darkmode.tsx';
import { DesignProjectInfoCard } from '@/components/layout-wrapper/design/header/design-project-info-card.tsx';
import { DesignSpaceSidebar } from '@/components/layout-wrapper/design/space/sidebar';
import { VinesSpace } from '@/components/layout-wrapper/space';
import { SpaceHeader } from '@/components/layout-wrapper/space/header';
import { SpaceSidebar } from '@/components/layout-wrapper/space/sidebar';
import { I18nSelector } from '@/components/ui/i18n-selector';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';

export const DesignLayout: React.FC = () => {
  return (
    <main className="size-full bg-slate-3 p-4">
      <SpaceHeader>
        <DesignProjectInfoCard />
      </SpaceHeader>
      <VinesSpace
        sidebar={
          <SpaceSidebar>
            <ScrollArea className="h-full flex-1 overflow-y-scroll" scrollBarDisabled>
              <DesignSpaceSidebar />
            </ScrollArea>
            <div className="flex items-center gap-2">
              <VinesDarkMode />
              <I18nSelector />
            </div>
          </SpaceSidebar>
        }
      >
        <Outlet />
      </VinesSpace>
    </main>
  );
};
