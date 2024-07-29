import React, { useEffect } from 'react';

import { createRootRoute, Outlet, ScrollRestoration } from '@tanstack/react-router';

import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import { OEM } from '@/components/layout/oem';
import { MainWrapper } from '@/components/layout-wrapper/main';
import { WorkspaceWrapper } from '@/components/layout-wrapper/workspace';
import { WorkspaceIframe } from '@/components/layout-wrapper/workspace-iframe';
import { RouteEvent } from '@/components/router/event.tsx';
import { TeamsGuard } from '@/components/router/guard/team.tsx';
import { UserGuard } from '@/components/router/guard/user.tsx';
import { useVinesRoute } from '@/components/router/use-vines-route.ts';
import { TooltipProvider } from '@/components/ui/tooltip';
import { VinesGlobalUpload } from '@/components/ui/updater/vines-global-upload.tsx';
import { SIDEBAR_MAP } from '@/consts/sidebar.tsx';
import VinesEvent from '@/utils/events.ts';
import { IconGuard } from '@/components/ui/vines-icon/lucide/guard.tsx';

const RootComponent: React.FC = () => {
  const { t } = useTranslation();

  const { routeIds, routeAppId, isUseOutside, isUseWorkSpace, isUseVinesCore } = useVinesRoute();

  const namePath = SIDEBAR_MAP.flatMap((it) =>
    it.items
      ? it.items.map((sub) => {
          return {
            ...sub,
            namePath: it.name + '.' + sub.name,
          };
        })
      : {
          ...it,
          namePath: it.name,
        },
  ).find((it) => it.name === routeAppId)?.namePath;

  const routeSiteName = namePath
    ? t(`components.layout.main.sidebar.list.${namePath}.label`)
    : routeIds?.length
      ? t(`components.layout.main.sidebar.list.workbench.label`)
      : '';

  useEffect(() => {
    VinesEvent.emit('vines-update-site-title', routeSiteName);
  }, [routeSiteName]);

  return (
    <>
      <ScrollRestoration />
      <TooltipProvider delayDuration={100}>
        <VinesGlobalUpload />
        <main className="vines-ui h-screen w-screen">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={
                isUseVinesCore
                  ? 'vines-outlet-core'
                  : isUseOutside
                    ? 'vines-outlet-outside'
                    : isUseWorkSpace
                      ? 'vines-outlet-workspace'
                      : 'vines-outlet-main'
              }
              className="vines-center relative size-full flex-col"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {isUseVinesCore ? (
                <WorkspaceIframe />
              ) : isUseOutside ? (
                <Outlet />
              ) : isUseWorkSpace ? (
                <WorkspaceWrapper />
              ) : (
                <MainWrapper layoutId={'vines-outlet-main-' + routeIds?.join('-')} />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </TooltipProvider>
      <OEM />
      <TeamsGuard />
      <UserGuard />
      <IconGuard />
      <RouteEvent />
    </>
  );
};
export const Route = createRootRoute({
  component: RootComponent,
});
