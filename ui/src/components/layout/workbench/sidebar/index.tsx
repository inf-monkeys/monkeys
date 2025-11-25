import React from 'react';

import { useSystemConfig } from '@/apis/common';
import { TeamSelector } from '@/components/layout/main/sidebar/teams/team-selector';
import { WorkbenchMiniModeSidebar } from '@/components/layout/workbench/sidebar/mode/mini';
import { WorkbenchNormalModeSidebar } from '@/components/layout/workbench/sidebar/mode/normal';
import { cn } from '@/utils';

import { WorkbenchModernModeSidebar } from './mode/modern';

interface IWorkbenchSidebarProps extends React.ComponentPropsWithoutRef<'div'> {
  mode?: 'normal' | 'fast' | 'mini';
  showGroup?: boolean;
  collapsed?: boolean;
}

export const WorkbenchSidebar: React.FC<IWorkbenchSidebarProps> = ({
  mode = 'normal',
  showGroup = true,
  collapsed = false,
}) => {
  const { data: oem, isLoading } = useSystemConfig();

  const showSidebarTeamSelector = oem?.theme.showSidebarTeamSelector ?? false;

  const modern = oem?.theme.workbenchSidebarModernMode ?? false;

  if (mode === 'mini') {
    return <WorkbenchMiniModeSidebar />;
  }

  return (
    <div className={`relative flex h-full flex-col gap-global transition-all duration-300 ${collapsed ? 'w-12' : ''}`}>
      {!isLoading && showSidebarTeamSelector && (
        <div className={`flex flex-col ${collapsed ? 'hidden' : ''}`}>
          <TeamSelector size="large" teamNameWidth="small" />
        </div>
      )}
      <div className={cn('h-full', collapsed && 'hidden')}>
        {modern ? (
          <WorkbenchModernModeSidebar collapsed={collapsed} />
        ) : (
          <WorkbenchNormalModeSidebar showGroup={showGroup} collapsed={collapsed} />
        )}
      </div>
    </div>
  );
};
