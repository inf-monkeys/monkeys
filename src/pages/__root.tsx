import React from 'react';

import { createRootRoute, Outlet, ScrollRestoration, useRouterState } from '@tanstack/react-router';

import { NextUIProvider } from '@nextui-org/system';

import { OEM } from '@/components/layout/oem';
import { MainWrapper } from '@/components/layout-wrapper/main';
import { WorkspaceWrapper } from '@/components/layout-wrapper/workspace/Workspace.tsx';
import { TeamsGuard } from '@/components/router/guard/team.tsx';
import { TooltipProvider } from '@/components/ui/tooltip';

const RootComponent: React.FC = () => {
  const { matches } = useRouterState();

  const routeMatch = matches.find((it) => it.routeId.includes('/$teamId'));
  const routeIds = routeMatch?.routeId
    ?.substring(1)
    ?.split('/')
    ?.filter((it) => it);

  const isUseOutside = !routeIds;
  const isUseWorkSpace = routeIds?.at(1) === 'workspace';

  return (
    <main className="vines-ui relative flex h-screen w-screen flex-col items-center justify-center">
      <ScrollRestoration />
      <NextUIProvider>
        <TooltipProvider delayDuration={100}>
          {isUseOutside ? <Outlet /> : isUseWorkSpace ? <WorkspaceWrapper /> : <MainWrapper />}
        </TooltipProvider>
      </NextUIProvider>
      <OEM />
      <TeamsGuard />
    </main>
  );
};
export const Route = createRootRoute({
  component: RootComponent,
});
