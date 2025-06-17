import React, { useLayoutEffect } from 'react';

import { Outlet, useRouterState } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { TeamSelector } from '@/components/layout/main/sidebar/teams/team-selector';
import { VinesSpace } from '@/components/layout-wrapper/space';
import { SpaceHeader } from '@/components/layout-wrapper/space/header';
import { ViewGuard } from '@/components/layout-wrapper/view-guard.tsx';
import { VinesPanelSidebar } from '@/components/layout-wrapper/workbench/panel/sidebar.tsx';
import { useVinesTeam } from '@/components/router/guard/team.tsx';
import { usePageStore } from '@/store/usePageStore';
import { cn } from '@/utils';
import { SpaceHeaderTabs } from '@/components/layout-wrapper/space/header/tabs';

interface IWorkbenchPanelLayoutProps {
  layoutId: string;
}

export const WorkbenchPanelLayout: React.FC<IWorkbenchPanelLayoutProps> = ({ layoutId }) => {
  const { t } = useTranslation();
  const { teamId } = useVinesTeam();

  const setWorkbenchVisible = usePageStore((s) => s.setWorkbenchVisible);

  useLayoutEffect(() => {
    setWorkbenchVisible(true);
  }, []);

  const isWorkbenchRoute = layoutId === 'vines-outlet-main-$teamId';
  const isStoreRoute = layoutId === 'vines-outlet-main-$teamId-store';
  const isWorkspaceRoute = layoutId.startsWith('vines-outlet-main-$teamId-') && !isStoreRoute;
  const pathName = useRouterState({
    select: (state) => {
      return state.location.pathname;
    },
  });
  const isSettingRoute = pathName.split('/').at(-1) === 'settings';
  return (
    <ViewGuard className="bg-neocard">
      <SpaceHeader tail={<TeamSelector />} disableSeparator>
        <SpaceHeaderTabs />
      </SpaceHeader>
      <VinesSpace
        className={cn(
          isWorkbenchRoute && 'overflow-auto bg-transparent p-0 shadow-none transition-colors',
          isWorkspaceRoute && !isSettingRoute && 'w-full p-4',
          isSettingRoute && 'w-full px-4 py-1',
        )}
        sidebar={isWorkspaceRoute && <VinesPanelSidebar />}
      >
        <Outlet />
      </VinesSpace>
    </ViewGuard>
  );
};
