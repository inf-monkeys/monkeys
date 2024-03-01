import React from 'react';

import { Outlet } from '@tanstack/react-router';

import { AnimatePresence, motion } from 'framer-motion';

import { Sidebar } from '@/components/layout/main/sidebar';

interface IProps {
  layoutId: string;
}

export const MainWrapper: React.FC<IProps> = ({ layoutId }) => {
  return (
    <div className="flex w-screen bg-slate-3">
      <Sidebar />
      <AnimatePresence mode="wait">
        <div className="m-4 ml-0 flex w-full flex-1 rounded-xl bg-slate-1 p-4">
          <motion.div
            key={layoutId}
            className="relative size-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Outlet />
          </motion.div>
        </div>
      </AnimatePresence>
    </div>
  );
};
