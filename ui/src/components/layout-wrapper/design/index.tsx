import React from 'react';

import { Outlet } from '@tanstack/react-router';

export const DesignLayout: React.FC = () => {
  return (
    <main className="size-full bg-slate-3 p-4">
      <Outlet />
    </main>
  );
};
