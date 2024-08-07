import React from 'react';

import { WorkbenchMiniModeSidebar } from '@/components/layout/workbench/sidebar/mode/mini';
import { WorkbenchNormalModeSidebar } from '@/components/layout/workbench/sidebar/mode/normal';

interface IWorkbenchSidebarProps extends React.ComponentPropsWithoutRef<'div'> {
  groupId: string;
  setGroupId: React.Dispatch<React.SetStateAction<string>>;
  mode?: 'normal' | 'fast' | 'mini';
}

export const WorkbenchSidebar: React.FC<IWorkbenchSidebarProps> = ({ groupId, setGroupId, mode = 'normal' }) => {
  return mode === 'mini' ? (
    <WorkbenchMiniModeSidebar />
  ) : (
    <WorkbenchNormalModeSidebar groupId={groupId} setGroupId={setGroupId} />
  );
};
