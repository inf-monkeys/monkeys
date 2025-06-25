import React from 'react';

import { useMatches } from '@tanstack/react-router';

import { VinesSpace } from '@/components/layout-wrapper/space';
import { SpaceHeader } from '@/components/layout-wrapper/space/header';
import { SpaceSidebar } from '@/components/layout-wrapper/space/sidebar';
import { ViewGuard } from '@/components/layout-wrapper/view-guard';
import { ScrollArea } from '@/components/ui/scroll-area';

import { EvaluationModuleInfoCard } from './module-info-card';
import { EvaluationSidebarFooter } from './sidebar-footer';
import { EvaluationTabs } from './tabs';
import { EvaluationViews } from './views';

interface EvaluationLayoutProps {
  currentTab?: string;
}

export const EvaluationLayout: React.FC<EvaluationLayoutProps> = ({ currentTab: propCurrentTab }) => {
  // 从路由参数中获取currentTab
  const matches = useMatches();
  const evaluationMatch = matches.find(match => match.routeId.includes('evaluations'));
  const currentTab = propCurrentTab || evaluationMatch?.params?.tab || 'leaderboard';
  return (
    <ViewGuard className="bg-neocard">
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