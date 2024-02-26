import React from 'react';

import { createRootRoute, Outlet, ScrollRestoration } from '@tanstack/react-router';

import { NextUIProvider } from '@nextui-org/system';

import { OEM } from '@/components/layout/oem';
import { TooltipProvider } from '@/components/ui/tooltip';

const RootComponent: React.FC = () => {
  return (
    <main className="vines-ui relative flex h-screen w-screen flex-col items-center justify-center">
      <ScrollRestoration />
      <NextUIProvider>
        <TooltipProvider delayDuration={100}>
          <Outlet />
        </TooltipProvider>
      </NextUIProvider>
      <OEM />
    </main>
  );
};
export const Route = createRootRoute({
  component: RootComponent,
});
