import React from 'react';

import { createRootRoute, Outlet, ScrollRestoration, useMatches } from '@tanstack/react-router';

import { useDocumentTitle } from '@mantine/hooks';
import { NextUIProvider } from '@nextui-org/system';
import { motion } from 'framer-motion';
import { get } from 'lodash';

import { useOemConfig } from '@/apis/common';
import { OEM } from '@/components/layout/oem';
import { MainWrapper } from '@/components/layout-wrapper/main';
import { WorkspaceWrapper } from '@/components/layout-wrapper/workspace/Workspace.tsx';
import { TeamsGuard } from '@/components/router/guard/team.tsx';
import { UserGuard } from '@/components/router/guard/user.tsx';
import { TooltipProvider } from '@/components/ui/tooltip';
import { SIDEBAR_MAP } from '@/consts/sidebar.tsx';

const RootComponent: React.FC = () => {
  const { data: oem } = useOemConfig();
  const matches = useMatches();

  const routeMatch = matches.find((it) => it.routeId.includes('/$teamId'));
  const routeIds = routeMatch?.routeId
    ?.substring(1)
    ?.split('/')
    ?.filter((it: string) => it);

  const routeAppId = routeIds?.at(1);
  const oemSiteName = get(oem, 'theme.name', 'AI');
  const routeSiteName =
    SIDEBAR_MAP.flatMap((it) => it.items || []).find((it) => it.name === routeAppId)?.label ??
    (routeIds?.length ? '工作台' : '');
  useDocumentTitle(routeSiteName ? `${routeSiteName} - ${oemSiteName}` : oemSiteName);

  const isUseOutside = !routeIds;
  const isUseWorkSpace = routeAppId === 'workspace';

  return (
    <>
      <ScrollRestoration />
      <NextUIProvider>
        <TooltipProvider delayDuration={100}>
          <main className="vines-ui h-screen w-screen">
            <motion.div
              key={isUseOutside ? 'vines-outside' : isUseWorkSpace ? 'vines-workspace' : 'vines-main'}
              className="vines-center relative size-full flex-col"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {isUseOutside ? (
                <Outlet />
              ) : isUseWorkSpace ? (
                <WorkspaceWrapper />
              ) : (
                <MainWrapper layoutId={'vines-' + routeIds?.join('-')} />
              )}
            </motion.div>
          </main>
        </TooltipProvider>
      </NextUIProvider>
      <OEM />
      <TeamsGuard />
      <UserGuard />
    </>
  );
};
export const Route = createRootRoute({
  component: RootComponent,
});
