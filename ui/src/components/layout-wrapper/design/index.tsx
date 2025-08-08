import React from 'react';

import { Outlet } from '@tanstack/react-router';

import { get } from 'lodash';

import { useSystemConfig } from '@/apis/common';
import { VinesDarkMode } from '@/components/layout/main/vines-darkmode.tsx';
import { DesignProjectInfoCard } from '@/components/layout-wrapper/design/header/design-project-info-card.tsx';
import { DesignSpaceSidebar } from '@/components/layout-wrapper/design/space/sidebar';
import { VinesSpace } from '@/components/layout-wrapper/space';
import { SpaceHeader } from '@/components/layout-wrapper/space/header';
import { SpaceSidebar } from '@/components/layout-wrapper/space/sidebar';
import { I18nSelector } from '@/components/ui/i18n-selector';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { cn } from '@/utils';

export const DesignLayout: React.FC = () => {
  const { data: oem } = useSystemConfig();
  const themeMode = get(oem, 'theme.themeMode', 'shadow');
  
  //  
  const isLFTheme = themeMode === 'shadow';
  const backgroundClass = isLFTheme ? 'bg-[#f3f4f6]' : 'bg-slate-3';
  
  return (
    <main className={cn("size-full p-global", backgroundClass)}>
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
