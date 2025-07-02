import React from 'react';

import { useSystemConfig } from '@/apis/common';
import { TeamSelector } from '@/components/layout/main/sidebar/teams/team-selector';
import { WorkbenchMiniModeSidebar } from '@/components/layout/workbench/sidebar/mode/mini';
import { WorkbenchNormalModeSidebar } from '@/components/layout/workbench/sidebar/mode/normal';
import { cn } from '@/utils';

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

  if (mode === 'mini') {
    return <WorkbenchMiniModeSidebar />;
  }

  return (
    <div className={`relative flex h-full flex-col gap-4 transition-all duration-300 ${collapsed ? 'w-12' : ''}`}>
      {!isLoading && showSidebarTeamSelector && (
        <div className={`mr-4 flex flex-col ${collapsed ? 'hidden' : ''}`}>
          <TeamSelector size="large" teamNameWidth="small" />
        </div>
      )}
      <div className={cn('h-full', collapsed && 'hidden')}>
        <WorkbenchNormalModeSidebar showGroup={showGroup} collapsed={collapsed} />
      </div>
    </div>
  );
};
