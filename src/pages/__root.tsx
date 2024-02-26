import React from 'react';

import { createRootRoute, Outlet, ScrollRestoration } from '@tanstack/react-router';

import { NextUIProvider } from '@nextui-org/system';

import { OEM } from '@/components/layout/oem';
import { TeamsGuard } from '@/components/router/guard/team.tsx';

const RootComponent: React.FC = () => {
  return (
    <main className="vines-ui relative flex h-screen w-screen flex-col items-center justify-center">
      <ScrollRestoration />
      <NextUIProvider>
        <Outlet />
      </NextUIProvider>
      <OEM />
      <TeamsGuard />
    </main>
  );
};
export const Route = createRootRoute({
  component: RootComponent,
});
