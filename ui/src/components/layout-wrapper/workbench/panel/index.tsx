import React, { useLayoutEffect } from 'react';

import { Outlet } from '@tanstack/react-router';

import { Layers2, Package, PackagePlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { TeamSelector } from '@/components/layout/main/sidebar/teams/team-selector';
import { VinesDarkMode } from '@/components/layout/main/vines-darkmode.tsx';
import { VinesSpace } from '@/components/layout-wrapper/space';
import { SpaceHeader } from '@/components/layout-wrapper/space/header';
import { ViewGuard } from '@/components/layout-wrapper/view-guard.tsx';
import { VinesPanelSidebar } from '@/components/layout-wrapper/workbench/panel/sidebar.tsx';
import { useVinesTeam } from '@/components/router/guard/team.tsx';
import { I18nSelector } from '@/components/ui/i18n-selector';
import { Separator } from '@/components/ui/separator.tsx';
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

  return (
    <ViewGuard className="bg-slate-3">
      <SpaceHeader
        tail={
          <div className="flex items-center gap-2">
            <VinesDarkMode />
            <I18nSelector />
            <Separator orientation="vertical" className="mx-2 h-6" />
            <TeamSelector />
          </div>
        }
        disableSeparator
      >
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
          <TabsList className="!h-9">
            <TabsTrigger className="gap-1 py-1" value="workbench">
              <Layers2 size={14} />
              {t('components.layout.main.sidebar.list.workbench.label')}
            </TabsTrigger>
            <TabsTrigger className="gap-1 py-1" value="store">
              <Package size={14} />
              {t('components.layout.main.sidebar.list.store.application-store.label')}
            </TabsTrigger>
            <TabsTrigger className="gap-1 py-1" value="main">
              <PackagePlus size={14} />
              {t('components.layout.main.sidebar.list.workspace.label')}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </SpaceHeader>
      <VinesSpace
        className={cn(isWorkbenchRoute && 'p-0', isWorkspaceRoute && 'w-full p-4')}
        sidebar={isWorkspaceRoute && <VinesPanelSidebar />}
      >
        <Outlet />
      </VinesSpace>
    </ViewGuard>
  );
};
