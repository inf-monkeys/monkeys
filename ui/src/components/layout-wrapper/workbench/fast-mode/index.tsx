import React from 'react';

import { Outlet } from '@tanstack/react-router';

import { VinesDarkMode } from '@/components/layout/main/vines-darkmode.tsx';
import { VinesSpace } from '@/components/layout-wrapper/space';
import { SpaceHeader } from '@/components/layout-wrapper/space/header';
import { ViewGuard } from '@/components/layout-wrapper/view-guard.tsx';
import { I18nSelector } from '@/components/ui/i18n-selector';

export const WorkbenchFastModeLayout: React.FC = () => {
  return (
    <ViewGuard className="bg-slate-3">
      <SpaceHeader
        tail={
          <div className="flex items-center gap-2">
            <VinesDarkMode />
            <I18nSelector />
          </div>
        }
      />
      <VinesSpace>
        <Outlet />
      </VinesSpace>
    </ViewGuard>
  );
};
