import React from 'react';

import { Outlet } from '@tanstack/react-router';

import { Sidebar } from '@/components/layout/main/sidebar';

export const MainWrapper: React.FC = () => {
  return (
    <div className="flex w-screen bg-slate-3">
      <Sidebar />
      <div className="m-4 ml-0 flex w-full flex-1 rounded-xl bg-slate-1 p-4">
        <Outlet />
      </div>
    </div>
  );
};
