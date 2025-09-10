import React, { useLayoutEffect } from 'react';

import { Outlet, useRouterState } from '@tanstack/react-router';

import { get } from 'lodash';

import { useSystemConfig } from '@/apis/common';
import { ISystemConfig } from '@/apis/common/typings';
import { TeamSelector } from '@/components/layout/main/sidebar/teams/team-selector';
import { VinesSpace } from '@/components/layout-wrapper/space';
import { SpaceHeader } from '@/components/layout-wrapper/space/header';
import { SpaceHeaderTabs } from '@/components/layout-wrapper/space/header/tabs';
import { ViewGuard } from '@/components/layout-wrapper/view-guard.tsx';
import { usePageStore } from '@/store/usePageStore';
import { cn } from '@/utils';

import { VinesPanelSidebar } from './sidebar';

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
  const isDesignRoute = layoutId === 'vines-outlet-main-$teamId-design-$designProjectId-$designBoardId';

  const pathName = useRouterState({
    select: (state) => {
      return state.location.pathname;
    },
  });
  const isSettingRoute = pathName.split('/').at(-1) === 'settings';

  const { data: oem } = useSystemConfig();
  const themeMode = get(oem, 'theme.themeMode', 'border') as ISystemConfig['theme']['themeMode'];
  const background = get(oem, 'theme.background', undefined) as ISystemConfig['theme']['background'];

  // 根据主题模式应用不同样式
  const isShadowMode = themeMode === 'shadow';
  const backgroundClass = background ? '' : isShadowMode ? 'bg-[#f2f3f4]' : 'bg-neocard';

  const showTeamSelector =
    oem &&
    (!oem.theme.headbar || oem.theme.headbar.actions === '*' || oem.theme.headbar.actions?.includes('team-selector'));

  return (
    <ViewGuard
      className={cn('flex flex-col gap-global', backgroundClass)}
      style={background ? { background: `url(${background}) no-repeat center center / cover` } : {}}
    >
      <SpaceHeader tail={showTeamSelector ? <TeamSelector /> : undefined} disableSeparator>
        <SpaceHeaderTabs />
      </SpaceHeader>
      <VinesSpace
        className={cn(
          isWorkbenchRoute && 'overflow-auto bg-transparent p-0 shadow-none transition-colors',
          isWorkspaceRoute && !isSettingRoute && `w-full rounded-lg border border-input p-global`,
          isSettingRoute && `w-full rounded-lg border border-input px-global py-1`,
        )}
        sidebar={
          isWorkspaceRoute &&
          !isDesignRoute &&
          layoutId != 'vines-outlet-main-$teamId-nav-$navId' && <VinesPanelSidebar />
        }
      >
        <Outlet />
      </VinesSpace>
    </ViewGuard>
  );
};
