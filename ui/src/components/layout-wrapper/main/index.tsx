import React from 'react';

import { Outlet } from '@tanstack/react-router';

import { AnimatePresence, motion } from 'framer-motion';

import { Sidebar } from '@/components/layout/main/sidebar';
import { ViewGuard } from '@/components/layout-wrapper/view-guard.tsx';
import { cn } from '@/utils';

interface IProps {
  layoutId: string;
}

export const MainWrapper: React.FC<IProps> = ({ layoutId }) => {
  return (
    <ViewGuard className="flex w-screen bg-slate-3">
      <Sidebar />
      <AnimatePresence mode="wait">
        <div
          className={cn(
            'm-4 ml-0 flex h-[calc(100vh-2rem)] w-full max-w-[calc(100vw-15rem)] flex-1 rounded-md border bg-background p-6 shadow-sm',
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
