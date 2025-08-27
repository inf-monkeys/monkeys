import React from 'react';

import { Outlet } from '@tanstack/react-router';

import { AnimatePresence, motion } from 'framer-motion';
import { get } from 'lodash';

import { useSystemConfig } from '@/apis/common';
import { Sidebar } from '@/components/layout/main/sidebar';
import { ViewGuard } from '@/components/layout-wrapper/view-guard.tsx';
import { cn } from '@/utils';

interface IProps {
  layoutId: string;
}

export const MainWrapper: React.FC<IProps> = ({ layoutId }) => {
  const { data: oem } = useSystemConfig();
  const themeMode = get(oem, 'theme.themeMode', 'shadow');

  // 根据主题模式应用不同样式
  const isShadowMode = themeMode === 'shadow';
  const backgroundClass = isShadowMode ? 'bg-[#f2f3f4]' : 'bg-slate-3';
  const roundedClass = isShadowMode ? 'rounded-lg' : 'rounded-md';

  return (
    <ViewGuard className={cn('flex w-screen', backgroundClass)}>
      <Sidebar />
      <AnimatePresence mode="wait">
        <div
          className={cn(
            `m-4 ml-0 flex h-[calc(100vh-2rem)] w-full max-w-[calc(100vw-15rem)] flex-1 ${roundedClass} border bg-background p-6 shadow-sm`,
            layoutId === 'vines-outlet-main-$teamId-workbench' && 'p-0',
          )}
        >
          <motion.div
            key={layoutId}
            className="relative size-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Outlet />
          </motion.div>
        </div>
      </AnimatePresence>
    </ViewGuard>
  );
};
