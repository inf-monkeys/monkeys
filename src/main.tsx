import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';

import { SWRConfig } from 'swr';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import { routeTree } from '@/routeTree.gen';

import 'normalize.css';
import '@/styles/index.scss';

import { MantineProvider } from '@mantine/core';
import * as Portal from '@radix-ui/react-portal';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import utc from 'dayjs/plugin/utc';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from 'sonner';

import { LagRadar } from '@/components/devtools/lag-radar/dev';
import { ErrorComponent } from '@/components/router/catch-boundary';

dayjs.extend(duration);
dayjs.extend(utc);

const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  defaultErrorComponent: ({ error }) => <ErrorComponent error={error} />,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

ReactDOM.createRoot(document.getElementById('vines-ui')!).render(
  <>
    <SWRConfig>
      <MantineProvider>
        <AnimatePresence mode="wait">
          <RouterProvider router={router} />
        </AnimatePresence>
      </MantineProvider>
    </SWRConfig>
    <Suspense>
      <LagRadar />
    </Suspense>
    <Portal.Root>
      <Toaster richColors visibleToasts={10} />
    </Portal.Root>
  </>,
);
