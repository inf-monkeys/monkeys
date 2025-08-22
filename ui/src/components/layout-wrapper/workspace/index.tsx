import React from 'react';

import { Outlet } from '@tanstack/react-router';

import { get } from 'lodash';

import { useSystemConfig } from '@/apis/common';
import { TeamSelector } from '@/components/layout/main/sidebar/teams/team-selector';
import { VinesSpace } from '@/components/layout-wrapper/space';
import { SpaceHeader } from '@/components/layout-wrapper/space/header';
import { SpaceHeaderTabs } from '@/components/layout-wrapper/space/header/tabs';
import { SpaceSidebar } from '@/components/layout-wrapper/space/sidebar';
import { ViewGuard } from '@/components/layout-wrapper/view-guard.tsx';
import { WorkflowInfoCard } from '@/components/layout-wrapper/workspace/header/workflow-info-card.tsx';
import { FullScreenDisplay } from '@/components/layout-wrapper/workspace/space/full-screen-display.tsx';
import { Footer } from '@/components/layout-wrapper/workspace/space/sidebar/footer';
import { SpaceTabs } from '@/components/layout-wrapper/workspace/space/sidebar/tabs';
import { useVinesRoute } from '@/components/router/use-vines-route';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { cn } from '@/utils';

export const WorkspaceLayout: React.FC = () => {
  // 获取路由信息，判断是否是图片详情页
  const { isImageDetailPage } = useVinesRoute();
  // const { t } = useTranslation();
  // const { teamId } = useVinesTeam();

  // // 获取当前路径
  // const pathName = useRouterState({
  //   select: (state) => {
  //     return state.location.pathname;
  //   },
  // });

  const { data: oem } = useSystemConfig();
  const themeMode = get(oem, 'theme.themeMode', 'shadow');

  // 针对LF客户的主题定制
  const isLFTheme = themeMode === 'shadow';
  const backgroundClass = isLFTheme ? 'bg-[#f3f4f6]' : 'bg-neocard';

  const showTeamSelector =
    oem &&
    (!oem.theme.headbar || oem.theme.headbar.actions === '*' || oem.theme.headbar.actions?.includes('team-selector'));

  return (
    <ViewGuard className={cn('flex flex-col gap-global', backgroundClass)}>
      {isImageDetailPage ? (
        // 图片详情页使用与工作台、应用市场相同的header
        <SpaceHeader tail={showTeamSelector ? <TeamSelector /> : undefined} disableSeparator>
          <SpaceHeaderTabs />
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
