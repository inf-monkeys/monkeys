import { RouterProvider, createRouter } from '@tanstack/react-router';
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { routeTree } from './routeTree.gen';

import {
    applyFavicon,
    formatAdminTitle,
    getBrandFaviconUrl,
    getBrandTitle,
    useSystemConfigStore,
} from '@/store/system-config';

// Create a new router instance
const router = createRouter({ routeTree });

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

async function bootstrap() {
  await useSystemConfigStore.getState().load();
  const config = useSystemConfigStore.getState().config;
  document.title = formatAdminTitle(getBrandTitle(config));

  if (typeof window !== 'undefined') {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const set = (isDark: boolean) => applyFavicon(getBrandFaviconUrl(config, { darkMode: isDark }));
    set(media.matches);
    media.addEventListener?.('change', (e) => set(e.matches));
  }

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>
  );
}

void bootstrap();
