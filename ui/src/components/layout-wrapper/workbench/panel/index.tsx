import React, { useLayoutEffect } from 'react';

import { Outlet, useRouterState } from '@tanstack/react-router';

import { useSystemConfig } from '@/apis/common';
import { TeamSelector } from '@/components/layout/main/sidebar/teams/team-selector';
import { VinesSpace } from '@/components/layout-wrapper/space';
import { SpaceHeader } from '@/components/layout-wrapper/space/header';
import { SpaceHeaderTabs } from '@/components/layout-wrapper/space/header/tabs';
import { ViewGuard } from '@/components/layout-wrapper/view-guard.tsx';
import { VinesPanelSidebar } from '@/components/layout-wrapper/workbench/panel/sidebar.tsx';
import { usePageStore } from '@/store/usePageStore';
import { cn } from '@/utils';

interface IWorkbenchPanelLayoutProps {
  layoutId: string;
}

export const WorkbenchPanelLayout: React.FC<IWorkbenchPanelLayoutProps> = ({ layoutId }) => {
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

  const { data: oem } = useSystemConfig();

  const showTeamSelector =
    oem &&
    (!oem.theme.headbar || oem.theme.headbar.actions === '*' || oem.theme.headbar.actions?.includes('team-selector'));

  return (
    <ViewGuard className="flex flex-col gap-global bg-neocard">
      <SpaceHeader tail={showTeamSelector ? <TeamSelector /> : undefined} disableSeparator>
        <SpaceHeaderTabs />
      </SpaceHeader>
      <VinesSpace
        className={cn(
          isWorkbenchRoute && 'overflow-auto bg-transparent p-0 shadow-none transition-colors',
          isWorkspaceRoute && !isSettingRoute && 'w-full border border-input p-global',
          isSettingRoute && 'w-full border border-input px-global py-1',
        )}
        sidebar={isWorkspaceRoute && <VinesPanelSidebar />}
      >
        <Outlet />
      </VinesSpace>
    </ViewGuard>
  );
};
