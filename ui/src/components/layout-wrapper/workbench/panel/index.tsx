import React, { useLayoutEffect } from 'react';

import { Outlet, useRouterState } from '@tanstack/react-router';

import { Layers2, Package, PackagePlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { TeamSelector } from '@/components/layout/main/sidebar/teams/team-selector';
import { VinesSpace } from '@/components/layout-wrapper/space';
import { SpaceHeader } from '@/components/layout-wrapper/space/header';
import { ViewGuard } from '@/components/layout-wrapper/view-guard.tsx';
import { VinesPanelSidebar } from '@/components/layout-wrapper/workbench/panel/sidebar.tsx';
import { useVinesTeam } from '@/components/router/guard/team.tsx';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs.tsx';
import { usePageStore } from '@/store/usePageStore';
import { cn } from '@/utils';
import VinesEvent from '@/utils/events.ts';

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
    <ViewGuard className="bg-slate-3">
      <SpaceHeader tail={<TeamSelector />} disableSeparator>
        <Tabs
          value={isWorkspaceRoute ? 'main' : isStoreRoute ? 'store' : 'workbench'}
          onValueChange={(val) => {
            switch (val) {
              case 'workbench':
                VinesEvent.emit('vines-nav', '/$teamId/', { teamId });
                break;
              case 'store':
                VinesEvent.emit('vines-nav', '/$teamId/store/', { teamId });
                break;
              case 'main':
                VinesEvent.emit('vines-nav', '/$teamId/agents/', { teamId });
            }
          }}
        >
          <TabsList className="!h-9 p-0">
            <TabsTrigger
              className="!h-9 gap-1 text-muted-foreground *:data-[state=active]:stroke-foreground"
              value="workbench"
            >
              <Layers2 size={14} className="stroke-muted-foreground" />
              {t('components.layout.main.sidebar.list.workbench.label')}
            </TabsTrigger>
            <TabsTrigger
              className="!h-9 gap-1 text-muted-foreground *:data-[state=active]:stroke-foreground"
              value="store"
            >
              <Package size={14} className="stroke-muted-foreground" />
              {t('components.layout.main.sidebar.list.store.application-store.label')}
            </TabsTrigger>
            <TabsTrigger
              className="!h-9 gap-1 text-muted-foreground *:data-[state=active]:stroke-foreground"
              value="main"
            >
              <PackagePlus size={14} className="stroke-muted-foreground" />
              {t('components.layout.main.sidebar.list.workspace.label')}
            </TabsTrigger>
          </TabsList>
        </Tabs>
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
