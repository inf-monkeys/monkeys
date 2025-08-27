import React, { useEffect } from 'react';

import { Outlet } from '@tanstack/react-router';

import { get } from 'lodash';

import { useSystemConfig } from '@/apis/common';
import { ViewGuard } from '@/components/layout-wrapper/view-guard.tsx';
import { usePageStore } from '@/store/usePageStore';
import { cn } from '@/utils';

interface IWorkbenchMiniModeWrapperProps extends React.ComponentPropsWithoutRef<'div'> {}

export const WorkbenchMiniModeLayout: React.FC<IWorkbenchMiniModeWrapperProps> = () => {
  const { data: oem } = useSystemConfig();
  const themeMode = get(oem, 'theme.themeMode', 'shadow');

  // 根据主题模式应用不同样式
  const isShadowMode = themeMode === 'shadow';
  const backgroundClass = isShadowMode ? 'bg-[#f2f3f4]' : 'bg-slate-1';

  const setWorkbenchVisible = usePageStore((s) => s.setWorkbenchVisible);

  useEffect(() => {
    setWorkbenchVisible(true);
  }, []);

  return (
    <ViewGuard className={cn(backgroundClass, '!p-0')}>
      <Outlet />
    </ViewGuard>
  );
};
