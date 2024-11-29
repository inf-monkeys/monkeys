import { Suspense } from 'react';
import ReactDOM from 'react-dom/client';

import { SWRConfig } from 'swr';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import { routeTree } from '@/routeTree.gen';

import 'normalize.css';
import '@/styles/index.scss';

import * as Portal from '@radix-ui/react-portal';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import utc from 'dayjs/plugin/utc';
import { AnimatePresence, MotionConfig } from 'framer-motion';

import { LagRadar } from '@/components/devtools/lag-radar/dev';
import { ErrorComponent } from '@/components/router/catch-boundary';

dayjs.extend(duration);
dayjs.extend(utc);

import { Skeleton } from '@/components/ui/skeleton.tsx';
import { Toaster } from '@/components/ui/toaster';

import './polyfill';
import './i18n';

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
  <Suspense fallback={<Skeleton className="h-screen w-screen" />}>
    <SWRConfig>
      <MotionConfig transition={{ duration: 0.2 }}>
        <AnimatePresence mode="wait">
          <RouterProvider router={router} />
        </AnimatePresence>
      </MotionConfig>
    </SWRConfig>
    <Suspense>
      <LagRadar />
    </Suspense>
    <Portal.Root>
      <Toaster />
    </Portal.Root>
  </Suspense>,
);
