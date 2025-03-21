import React from 'react';

import { WorkbenchMiniModeSidebar } from '@/components/layout/workbench/sidebar/mode/mini';
import { WorkbenchNormalModeSidebar } from '@/components/layout/workbench/sidebar/mode/normal';

interface IWorkbenchSidebarProps extends React.ComponentPropsWithoutRef<'div'> {
  mode?: 'normal' | 'fast' | 'mini';
  showGroup?: boolean;
}

export const WorkbenchSidebar: React.FC<IWorkbenchSidebarProps> = ({ mode = 'normal', showGroup = true }) => {
  return mode === 'mini' ? <WorkbenchMiniModeSidebar /> : <WorkbenchNormalModeSidebar showGroup={showGroup} />;
};
