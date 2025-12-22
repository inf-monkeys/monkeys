import { Suspense } from 'react';
import ReactDOM from 'react-dom/client';

import { SWRConfig } from 'swr';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import { routeTree } from '@/routeTree.gen';

import 'normalize.css';
import '@/styles/index.scss';
// @assistant-ui/react v0.11+ 不再需要手动导入 CSS

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

import './i18n';
import './polyfill';

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

// 创建 React Query 客户端
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5分钟
    },
  },
});

ReactDOM.createRoot(document.getElementById('vines-ui')!).render(
  <Suspense fallback={<Skeleton className="h-screen w-screen" />}>
    <QueryClientProvider client={queryClient}>
      <SWRConfig>
        <MotionConfig transition={{ duration: 0.2 }}>
          <AnimatePresence mode="wait">
            <RouterProvider router={router} />
          </AnimatePresence>
        </MotionConfig>
      </SWRConfig>
    </QueryClientProvider>
    <Suspense>
      <LagRadar />
    </Suspense>
    <Portal.Root>
      <Toaster />
    </Portal.Root>
  </Suspense>,
);
