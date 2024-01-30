import React from 'react';

import { createRootRoute, Outlet } from '@tanstack/react-router';

const RootComponent: React.FC = () => {
  return (
    <main className="flex h-screen w-screen items-center justify-center">
      <Outlet />
    </main>
  );
};
export const Route = createRootRoute({
  component: RootComponent,
});
