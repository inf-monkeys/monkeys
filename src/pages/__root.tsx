import React from 'react';

import { createRootRoute, Outlet, ScrollRestoration } from '@tanstack/react-router';

import { NextUIProvider } from '@nextui-org/system';
import { Toaster } from 'sonner';

import { OEM } from '@/components/layout/oem';

const RootComponent: React.FC = () => {
  return (
    <main className="relative flex h-screen w-screen flex-col items-center justify-center">
      <ScrollRestoration />
      <NextUIProvider>
        <Outlet />
      </NextUIProvider>
      <Toaster richColors />
      <OEM />
    </main>
  );
};
export const Route = createRootRoute({
  component: RootComponent,
});
