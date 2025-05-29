import React from 'react';

import { Outlet, useRouterState } from '@tanstack/react-router';

import { Layers2, Package, PackagePlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { TeamSelector } from '@/components/layout/main/sidebar/teams/team-selector';
import { VinesSpace } from '@/components/layout-wrapper/space';
import { SpaceHeader } from '@/components/layout-wrapper/space/header';
import { SpaceSidebar } from '@/components/layout-wrapper/space/sidebar';
import { ViewGuard } from '@/components/layout-wrapper/view-guard.tsx';
import { WorkflowInfoCard } from '@/components/layout-wrapper/workspace/header/workflow-info-card.tsx';
import { FullScreenDisplay } from '@/components/layout-wrapper/workspace/space/full-screen-display.tsx';
import { Footer } from '@/components/layout-wrapper/workspace/space/sidebar/footer';
import { SpaceTabs } from '@/components/layout-wrapper/workspace/space/sidebar/tabs';
import { useVinesTeam } from '@/components/router/guard/team.tsx';
import { useVinesRoute } from '@/components/router/use-vines-route';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs.tsx';
import VinesEvent from '@/utils/events.ts';

export const WorkspaceLayout: React.FC = () => {
  // 获取路由信息，判断是否是图片详情页
  const { isImageDetailPage } = useVinesRoute();
  const { t } = useTranslation();
  const { teamId } = useVinesTeam();

  // 获取当前路径
  const pathName = useRouterState({
    select: (state) => {
      return state.location.pathname;
    },
  });

  return (
    <ViewGuard className="bg-card-light dark:bg-card-dark">
      {isImageDetailPage ? (
        // 图片详情页使用与工作台、应用市场相同的header
        <SpaceHeader tail={<TeamSelector />} disableSeparator>
          <Tabs
            value="workbench"
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
      ) : (
        // 普通工作空间页面使用原来的header
        <SpaceHeader>
          <WorkflowInfoCard />
        </SpaceHeader>
      )}
      <VinesSpace
        sidebar={
          // 图片详情页不显示侧边栏
          !isImageDetailPage ? (
            <SpaceSidebar>
              <ScrollArea className="h-full flex-1 overflow-y-scroll" scrollBarDisabled>
                <SpaceTabs />
              </ScrollArea>
              <Footer />
            </SpaceSidebar>
          ) : undefined
        }
      >
        <FullScreenDisplay />
        <Outlet />
      </VinesSpace>
    </ViewGuard>
  );
};
