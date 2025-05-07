import React from 'react';

import { useSystemConfig } from '@/apis/common';
import { TeamSelector } from '@/components/layout/main/sidebar/teams/team-selector';
import { WorkbenchMiniModeSidebar } from '@/components/layout/workbench/sidebar/mode/mini';
import { WorkbenchNormalModeSidebar } from '@/components/layout/workbench/sidebar/mode/normal';

interface IWorkbenchSidebarProps extends React.ComponentPropsWithoutRef<'div'> {
  mode?: 'normal' | 'fast' | 'mini';
  showGroup?: boolean;
}

export const WorkbenchSidebar: React.FC<IWorkbenchSidebarProps> = ({ mode = 'normal', showGroup = true }) => {
  const { data: oem, isLoading } = useSystemConfig();

  const showSidebarTeamSelector = oem?.theme.showSidebarTeamSelector ?? false;
  return mode === 'mini' ? (
    <WorkbenchMiniModeSidebar />
  ) : (
    <div className="flex flex-col gap-2">
      {!isLoading && showSidebarTeamSelector && (
        <div className="mr-4 flex flex-col">
          <TeamSelector size="large" />
        </div>
      )}
      <WorkbenchNormalModeSidebar showGroup={showGroup} />
    </div>
  );
};
