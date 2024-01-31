import React from 'react';

import { createRootRoute, Outlet, ScrollRestoration } from '@tanstack/react-router';

const RootComponent: React.FC = () => {
  return (
    <main className="relative flex h-screen w-screen items-center justify-center">
      <ScrollRestoration />
      <Outlet />
    </main>
  );
};
export const Route = createRootRoute({
  component: RootComponent,
});
