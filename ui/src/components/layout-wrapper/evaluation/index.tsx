import React from 'react';

import { useMatches } from '@tanstack/react-router';

import { get } from 'lodash';

import { useSystemConfig } from '@/apis/common';
import { VinesSpace } from '@/components/layout-wrapper/space';
import { SpaceHeader } from '@/components/layout-wrapper/space/header';
import { SpaceSidebar } from '@/components/layout-wrapper/space/sidebar';
import { ViewGuard } from '@/components/layout-wrapper/view-guard';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/utils';

import { EvaluationModuleInfoCard } from './module-info-card';
import { EvaluationSidebarFooter } from './sidebar-footer';
import { EvaluationTabs } from './tabs';
import { EvaluationViews } from './views';

interface EvaluationLayoutProps {
  currentTab?: string;
}

export const EvaluationLayout: React.FC<EvaluationLayoutProps> = ({ currentTab: propCurrentTab }) => {
  const { data: oem } = useSystemConfig();
  const themeMode = get(oem, 'theme.themeMode', 'shadow');

  // 针对LF客户的主题定制
  const isLFTheme = themeMode === 'shadow';
  const backgroundClass = isLFTheme ? 'bg-[#f2f3f4]' : 'bg-neocard';

  // 从路由参数中获取currentTab
  const matches = useMatches();
  const evaluationMatch = matches.find((match) => match.routeId.includes('evaluations'));
  const currentTab = propCurrentTab || evaluationMatch?.params?.tab || 'leaderboard';
  return (
    <ViewGuard className={cn('flex flex-col gap-global', backgroundClass)}>
      <SpaceHeader>
        <EvaluationModuleInfoCard />
      </SpaceHeader>
      <VinesSpace
        sidebar={
          <SpaceSidebar>
            <ScrollArea className="h-full flex-1 overflow-y-scroll">
              <EvaluationTabs currentTab={currentTab} />
            </ScrollArea>
            <EvaluationSidebarFooter />
          </SpaceSidebar>
        }
      >
        <EvaluationViews />
      </VinesSpace>
    </ViewGuard>
  );
};
