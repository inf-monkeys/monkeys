import React, { useEffect } from 'react';

import { Outlet } from '@tanstack/react-router';

import { ViewGuard } from '@/components/layout-wrapper/view-guard.tsx';
import { usePageStore } from '@/store/usePageStore';

interface IWorkbenchMiniModeWrapperProps extends React.ComponentPropsWithoutRef<'div'> {}

export const WorkbenchMiniModeLayout: React.FC<IWorkbenchMiniModeWrapperProps> = () => {
  const setWorkbenchVisible = usePageStore((s) => s.setWorkbenchVisible);

  useEffect(() => {
    setWorkbenchVisible(true);
  }, []);

  return (
    <ViewGuard className="bg-slate-1">
      <Outlet />
    </ViewGuard>
  );
};
