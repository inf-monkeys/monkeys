import { Suspense } from 'react';
import ReactDOM from 'react-dom/client';

import { SWRConfig } from 'swr';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import { routeTree } from '@/routeTree.gen';

import 'normalize.css';
import '@/styles/index.scss';

import { swrMiddleware } from '@/apis/middleware.ts';
import { localStorageProvider } from '@/apis/provider.ts';
import { LagRadar } from '@/components/devtools/lag-radar/dev';
import { ErrorComponent } from '@/components/router/catch-boundary';

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
    <SWRConfig value={{ use: [swrMiddleware], provider: localStorageProvider }}>
      <RouterProvider router={router} />
    </SWRConfig>
    <Suspense>
      <LagRadar />
    </Suspense>
  </>,
);
