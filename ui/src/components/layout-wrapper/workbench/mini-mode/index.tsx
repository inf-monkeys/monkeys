import React from 'react';

import { Outlet } from '@tanstack/react-router';

import { ViewGuard } from '@/components/layout-wrapper/view-guard.tsx';

interface IWorkbenchMiniModeWrapperProps extends React.ComponentPropsWithoutRef<'div'> {}

export const WorkbenchMiniModeLayout: React.FC<IWorkbenchMiniModeWrapperProps> = () => {
  return (
    <ViewGuard className="bg-slate-3">
      <Outlet />
    </ViewGuard>
  );
};
