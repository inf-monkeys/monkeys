import React from 'react';

import { Outlet } from '@tanstack/react-router';

import { VinesDarkMode } from '@/components/layout/main/vines-darkmode.tsx';
import { VinesSpace } from '@/components/layout-wrapper/space';
import { SpaceHeader } from '@/components/layout-wrapper/space/header';
import { ViewGuard } from '@/components/layout-wrapper/view-guard.tsx';
import { FullScreenDisplay } from '@/components/layout-wrapper/workspace/space/full-screen-display.tsx';
import { I18nSelector } from '@/components/ui/i18n-selector';

export const WorkbenchFastModeWrapper: React.FC = () => {
  return (
    <ViewGuard className="bg-slate-3">
      <SpaceHeader
        headerEndArea={
          <>
            <VinesDarkMode />
            <I18nSelector />
          </>
        }
      />
      <VinesSpace>
        <FullScreenDisplay />
        <Outlet />
      </VinesSpace>
    </ViewGuard>
  );
};
