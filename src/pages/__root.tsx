import React from 'react';

import { createRootRoute, Outlet, ScrollRestoration } from '@tanstack/react-router';

import { get } from 'lodash';
import { SuperSEO } from 'react-super-seo';
import { Toaster } from 'sonner';

import { useOemConfig } from '@/apis/common';

const RootComponent: React.FC = () => {
  const { data: oem } = useOemConfig();

  const siteName = get(oem, 'theme.name', '');
  const siteIcon = get(oem, 'theme.favicon.url', '');
  const siteIconType = get(oem, 'theme.favicon.type', '');

  return (
    <main className="relative flex h-screen w-screen items-center justify-center">
      <ScrollRestoration />
      <Outlet />
      <Toaster />
      {oem && (
        <SuperSEO title={siteName} description="懂业务的大模型流程引擎，零代码构建高价值 AI 应用。">
          <link rel="shortcut icon" type={siteIconType} href={siteIcon} />
        </SuperSEO>
      )}
    </main>
  );
};
export const Route = createRootRoute({
  component: RootComponent,
});
